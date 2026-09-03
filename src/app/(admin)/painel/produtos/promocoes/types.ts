// Espelha a resposta da API (nexus-api/src/promotions) — T3.10/T3.11.
export type PromotionStatus = "vigente" | "futura" | "encerrada";

export interface PromotionItem {
  id: string;
  productId: string;
  product: { id: string; name: string };
  promoPrice: string;
  vigencyType: "PERIODO" | "DIA_SEMANA";
  startDate: string | null;
  endDate: string | null;
  daysOfWeek: number[];
  endedEarly: boolean;
  status: PromotionStatus;
  createdAt: string;
}

export interface PromotionsPage {
  items: PromotionItem[];
  total: number;
  page: number;
  pageSize: number;
}
