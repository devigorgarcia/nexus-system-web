export type CreditPlan = {
  rate: string;
  passFeeToCustomer: boolean;
};

export const CARD_BRANDS = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "ELO", label: "Elo" },
  { value: "HIPERCARD", label: "Hipercard" },
  { value: "AMEX", label: "Amex" },
  { value: "DINERS", label: "Diners" },
  { value: "TODAS", label: "Todas" },
] as const;

export type CardBrand = (typeof CARD_BRANDS)[number]["value"];

export function cardBrandLabel(brand: string | undefined): string {
  return CARD_BRANDS.find((item) => item.value === brand)?.label ?? "Todas";
}

export type CardMachineRates = {
  anticipationRate: string;
  debitRate: string;
  creditPlans: CreditPlan[];
};

export function parseRate(value: string): number {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function emptyCreditPlans(): CreditPlan[] {
  return Array.from({ length: 12 }, () => ({
    rate: "0,00",
    passFeeToCustomer: false,
  }));
}

export function brandRate(
  rates: CardMachineRates,
  kind: "debit" | number,
): number {
  if (kind === "debit") return parseRate(rates.debitRate);
  const index = Math.min(12, Math.max(1, kind)) - 1;
  return parseRate(rates.creditPlans[index]?.rate ?? "0");
}

export function totalFeePercent(
  rates: CardMachineRates,
  kind: "debit" | number,
): number {
  return brandRate(rates, kind) + parseRate(rates.anticipationRate);
}

export function passesFeeToCustomer(
  rates: CardMachineRates,
  kind: "debit" | number,
): boolean {
  if (kind === "debit") return false;
  const index = Math.min(12, Math.max(1, kind)) - 1;
  return rates.creditPlans[index]?.passFeeToCustomer === true;
}

/** Rótulo curto: "sem juros até 2x" / "taxa no cliente" / "sem juros". */
export function interestFreeLabel(plans: CreditPlan[]): string {
  let until = 0;
  for (const plan of plans) {
    if (plan.passFeeToCustomer) break;
    until += 1;
  }
  if (until === 0) return "taxa no cliente";
  if (until === 12) return "sem juros";
  return `sem juros até ${until}x`;
}

export function installmentFeeLabel(
  plans: CreditPlan[] | undefined,
  n: number,
): string {
  return plans?.[n - 1]?.passFeeToCustomer ? "taxa no cliente" : "sem juros";
}

/** Mantém um corte contínuo: sem juros até Nx, depois taxa no cliente. */
export function applyFeeCutoff(
  plans: CreditPlan[],
  index: number,
  passFeeToCustomer: boolean,
): CreditPlan[] {
  return plans.map((plan, i) => {
    if (!passFeeToCustomer && i <= index) {
      return { ...plan, passFeeToCustomer: false };
    }
    if (passFeeToCustomer && i >= index) {
      return { ...plan, passFeeToCustomer: true };
    }
    return plan;
  });
}

export function netFromSale(
  saleAmount: number,
  feePercent: number,
): { fee: number; net: number } {
  const fee = saleAmount * (feePercent / 100);
  return { fee, net: saleAmount - fee };
}

export function chargeToReceive(
  desiredNet: number,
  feePercent: number,
): { charge: number; fee: number } {
  const factor = 1 - feePercent / 100;
  if (factor <= 0) return { charge: desiredNet, fee: 0 };
  const charge = desiredNet / factor;
  return { charge, fee: charge - desiredNet };
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function rateToDisplay(value: string): string {
  return value.replace(".", ",");
}

export function rateToApi(value: string): string {
  const n = Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return "0.00";
  return Math.min(n, 99.99).toFixed(2);
}
