import { test, expect } from "@playwright/test";

test("login page renders and the admin area redirects without a session", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await expect(page.getByLabel("Usuário")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();

  // T1.3 — rota (admin) protegida redireciona pro login sem sessão.
  await page.goto("/painel/pdv");
  await expect(page).toHaveURL(/\/login$/);
});
