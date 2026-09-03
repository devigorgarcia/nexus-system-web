import { test, expect } from "@playwright/test";

// Fluxo do Caixa (T5.2) ponta a ponta pela UI real: abrir caixa → card
// mostra "aberto" → fechar caixa → volta a pedir abertura. Assume nenhum
// caixa aberto no início (a suíte de dev não deixa nenhum aberto entre
// runs) — checar/fechar um caixa pré-existente aqui seria só mais
// superfície de corrida no PRÓPRIO teste, sem valor extra sobre o que já é
// coberto pelos testes e2e de backend (test/finance.e2e-spec.ts).
const ADMIN_EMAIL = "admin@nexus.com.br";
const ADMIN_PASSWORD = "admin1234";

test("Financeiro: abrir caixa → card mostra aberto → fechar caixa → volta a pedir abertura", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill(ADMIN_EMAIL);
  await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/painel\/pdv$/);

  await page.goto("/painel/financeiro");

  await page.getByRole("button", { name: "Abrir caixa" }).click();
  await page.getByLabel("Valor de abertura (R$)").fill("100.00");
  await page.getByRole("button", { name: "Abrir", exact: true }).click();

  const caixaCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "Caixa de hoje" });
  await expect(caixaCard.getByText("aberto", { exact: true })).toBeVisible({
    timeout: 5000,
  });
  await expect(caixaCard.getByText(/Abertura: R\$\s*100,00/)).toBeVisible();

  await page.getByRole("button", { name: "Fechar caixa" }).click();
  await page.getByLabel("Valor contado na gaveta (R$)").fill("100.00");
  await page.getByRole("button", { name: "Confirmar fechamento" }).click();

  await expect(page.getByRole("button", { name: "Abrir caixa" })).toBeVisible({
    timeout: 5000,
  });
});
