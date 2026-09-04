/** Converte o valor da API (`1234.56` / `1234`) para exibição `1.234,56`. */
export function formatMoneyDisplay(value: string): string {
  if (!value.trim()) return "";
  const amount = Number(value.replace(",", "."));
  if (!Number.isFinite(amount)) return "";
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Digita como centavos: `1` → `0.01`, `10300` → `103.00` (formato da API). */
export function parseMoneyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return (Number(digits) / 100).toFixed(2);
}
