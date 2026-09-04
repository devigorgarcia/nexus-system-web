export type ProductUnitType = "UNIDADE" | "METRO" | "PESO" | "VOLUME";

export const UNIT_TYPE_LABELS: Record<ProductUnitType, string> = {
  UNIDADE: "Unidade (peça)",
  METRO: "Metro",
  PESO: "Kg",
  VOLUME: "L",
};

export function unitSuffix(unitType: ProductUnitType): string {
  if (unitType === "PESO") return "kg";
  if (unitType === "VOLUME") return "L";
  if (unitType === "METRO") return "m";
  return "";
}

export function priceFieldLabels(unitType: ProductUnitType) {
  const suffix = unitSuffix(unitType);
  if (!suffix) {
    return { cost: "Custo", sale: "Venda" };
  }
  return {
    cost: `Custo por ${suffix}`,
    sale: `Venda por ${suffix}`,
  };
}

export function formatQuantity(
  value: string | number,
  unitType: ProductUnitType,
): string {
  const amount = Number(value);
  const formatted = Number.isFinite(amount)
    ? amount.toLocaleString("pt-BR", { maximumFractionDigits: 3 })
    : String(value);
  const suffix = unitSuffix(unitType);
  return suffix ? `${formatted} ${suffix}` : formatted;
}

export function quantityFieldLabel(unitType: ProductUnitType): string {
  const suffix = unitSuffix(unitType);
  return suffix ? `Quantidade (${suffix})` : "Quantidade";
}

/** Aceita `0,63` / `0.63` / `1.250,5` e devolve número, ou `null` se inválido. */
export function parseQuantity(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export function quantityToApi(raw: string): string {
  const amount = parseQuantity(raw);
  if (amount == null) return "";
  return String(amount);
}

/** Mantém a digitação em pt-BR: `0,63` (vírgula), até 3 casas em kg/m/L. */
export function maskQuantityInput(
  raw: string,
  unitType: ProductUnitType,
): string {
  if (unitType === "UNIDADE") {
    return raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  }

  const cleaned = raw.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const comma = cleaned.indexOf(",");
  if (comma === -1) {
    return cleaned.replace(/^0+(?=\d)/, "");
  }

  const intDigits = cleaned.slice(0, comma).replace(/\D/g, "");
  const decDigits = cleaned.slice(comma + 1).replace(/\D/g, "").slice(0, 3);
  const intPart = intDigits.replace(/^0+(?=\d)/, "") || "0";
  return `${intPart},${decDigits}`;
}
