export type CardMachineRates = {
  anticipationRate: string;
  debitRate: string;
  credit1xRate: string;
  credit2to6Rate: string;
  credit7to12Rate: string;
};

export function parseRate(value: string): number {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function brandRate(
  rates: CardMachineRates,
  kind: "debit" | number,
): number {
  if (kind === "debit") return parseRate(rates.debitRate);
  if (kind <= 1) return parseRate(rates.credit1xRate);
  if (kind <= 6) return parseRate(rates.credit2to6Rate);
  return parseRate(rates.credit7to12Rate);
}

export function totalFeePercent(
  rates: CardMachineRates,
  kind: "debit" | number,
): number {
  return brandRate(rates, kind) + parseRate(rates.anticipationRate);
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
