export type CreditPlan = {
  rate: string;
  passFeeToCustomer: boolean;
};

export type CardBrand =
  | "VISA"
  | "MASTERCARD"
  | "ELO"
  | "HIPERCARD"
  | "AMEX"
  | "DINERS"
  | "TODAS";

export type CardMachine = {
  id: string;
  name: string;
  brand: CardBrand;
  anticipationRate: string;
  debitRate: string;
  creditPlans: CreditPlan[];
  active: boolean;
};

export type CardMachineForm = {
  id: string | null;
  name: string;
  brand: CardBrand;
  anticipationRate: string;
  debitRate: string;
  creditPlans: CreditPlan[];
  active?: boolean;
};
