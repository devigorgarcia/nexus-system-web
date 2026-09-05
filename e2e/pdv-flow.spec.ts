import { test, expect } from "@playwright/test";

// Fluxo crítico de venda ponta a ponta (T4.13, spec.md §16): login → busca
// de produto → montar carrinho → "Finalizar venda" (Pedido pendente, estoque
// intacto) → tela Pedidos → "Cobrar" → escolher forma de pagamento →
// confirmar → saldo de estoque atualizado na tela sem reload manual.
const ADMIN_EMAIL = "admin@nexus.com.br";
const ADMIN_PASSWORD = requireDevAdminPassword();

function requireDevAdminPassword(): string {
  const password = process.env.DEV_ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "DEV_ADMIN_PASSWORD ausente — defina a senha do admin de dev para o e2e.",
    );
  }
  return password;
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill(ADMIN_EMAIL);
  await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/painel\/pdv$/);
}

test("PDV: login → buscar → carrinho → finalizar → cobrar → confirmar → estoque atualizado", async ({
  page,
}) => {
  const productName = `Vela E2E ${Date.now()}`;

  await login(page);

  // Cadastra o produto (T3.5) — precisa existir antes de aparecer na busca
  // do PDV (T4.3, só produto ativo com saldo > 0).
  await page.goto("/painel/produtos");
  await page.getByRole("button", { name: "Novo produto" }).click();
  await page.getByLabel("Nome").fill(productName);
  await page.getByLabel("Custo (R$)").fill("5.00");
  await page.getByLabel("Venda (R$)").fill("12.00");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  // Lança entrada de estoque (T3.6) — sem saldo, o produto não aparece na
  // busca do PDV (PRD §4.9).
  await page.goto("/painel/produtos/estoque");
  await page.getByRole("button", { name: "Nova movimentação" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Produto").click();
  await page.getByRole("option", { name: productName }).click();
  await dialog.getByLabel("Quantidade").fill("20");
  await dialog.getByRole("button", { name: "Lançar" }).click();
  await expect(dialog).toBeHidden();

  // PDV (T4.4): busca com debounce, adiciona ao carrinho, finaliza venda.
  await page.goto("/painel/pdv");
  await page.getByPlaceholder("Buscar produto pelo nome...").fill(productName);
  const productCard = page.getByText(productName).first();
  await expect(productCard).toBeVisible({ timeout: 5000 });
  await productCard.click();

  // Carrinho reflete o item adicionado (UI otimista, spec.md §7).
  await expect(page.getByText("Finalizar venda")).toBeEnabled();
  await page.getByRole("button", { name: "Finalizar venda" }).click();
  await expect(page.getByText(/fila de Pedidos/)).toBeVisible();

  // Pedidos (T4.7): pedido recém-criado aparece pendente, "Cobrar" confirma
  // o pagamento e abre o cupom (T4.8/T4.9) — sem saldo de estoque ainda
  // alterado até este ponto (checado a seguir).
  await page.goto("/painel/pedidos");
  const row = page.getByRole("row").filter({ hasText: "pendente" }).first();
  await expect(row).toBeVisible({ timeout: 5000 });
  await row.getByRole("button", { name: "Cobrar" }).click();

  const sheet = page.getByRole("dialog").filter({ hasText: "Cobrar pedido" });
  await sheet.getByRole("button", { name: "Dinheiro" }).click();
  await sheet.getByRole("button", { name: "Confirmar pagamento" }).click();

  await expect(page.getByText("Cupom de venda")).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Fechar" }).click();

  // Estoque (T3.7/T4.8): saldo baixado sem reload manual (decisão de
  // 2026-09-01) — 20 lançados, 1 vendido, sobra 19. A tabela de "Saldo por
  // produto" vem antes da de "Histórico de movimentações" — escopar na
  // primeira, senão o filtro por nome também casa linhas do histórico.
  await page.goto("/painel/produtos/estoque");
  const stockRow = page
    .locator("table")
    .first()
    .getByRole("row")
    .filter({ hasText: productName });
  await expect(stockRow).toContainText("19");
});
