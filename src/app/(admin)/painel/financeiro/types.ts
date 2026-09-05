// Espelha o `select`/resposta da API (nexus-api/src/finance) — T5.1/T5.3/T5.4/T5.5.
export type CashRegisterPaymentMethod =
  | "DINHEIRO"
  | "CARTAO_CREDITO"
  | "CARTAO_DEBITO"
  | "PIX";

export interface CashRegisterSale {
  id: string;
  number: number;
  paymentMethod: CashRegisterPaymentMethod | null;
  paidAt: string | null;
  vendedor: { id: string; name: string };
  total: string;
}

export interface CashRegisterItem {
  id: string;
  status: "ABERTO" | "FECHADO";
  openingAmount: string;
  closingAmount: string | null;
  expectedAmount: string | null;
  difference: string | null;
  openedAt: string;
  closedAt: string | null;
  responsavel: { id: string; name: string };
  salesCount?: number;
  totalSales?: string;
  cashSales?: string;
  pixSales?: string;
  cardSales?: string;
  sales?: CashRegisterSale[];
}

export interface CashRegistersPage {
  items: CashRegisterItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CashRegisterOverviewItem extends CashRegisterItem {
  cashSales: string;
  expectedNow: string;
}

export interface CashRegisterOverview {
  openCount: number;
  openingTotal: string;
  salesTotal?: string;
  cashSalesTotal: string;
  expectedTotal: string;
  registers: CashRegisterOverviewItem[];
}

export interface SalesByProductRow {
  productId: string;
  productName: string;
  quantitySold: string;
  revenue: string;
}

export interface SalesByProductReport {
  from: string;
  to: string;
  totalRevenue: string;
  byProduct: SalesByProductRow[];
}

export interface SalesByEmployeeRow {
  vendedorId: string;
  vendedorName: string;
  salesCount: number;
  revenue: string;
}

export interface DreReport {
  from: string;
  to: string;
  revenue: string;
  cogs?: string;
  margin?: string;
}

export type CashSalesReportPeriod =
  | "dia"
  | "semana"
  | "mes"
  | "personalizado";

export type AbcClass = "A" | "B" | "C";

export interface CashSalesReportProduct {
  productId: string;
  productName: string;
  unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
  abcClass: AbcClass;
  revenueShare: string;
  cumulativeShare: string;
  quantitySold: string;
  revenue: string;
  cost?: string;
  profit?: string;
}

export interface CashSalesReportHighlight {
  productId: string;
  productName: string;
  profit?: string;
}

export interface CashSalesReportAbcBucket {
  productCount: number;
  quantitySold: string;
  revenue: string;
  share: string;
  itemShare: string;
}

export interface CashSalesReport {
  period: CashSalesReportPeriod;
  from: string;
  to: string;
  totals: {
    quantitySold: string;
    revenue: string;
    cost?: string;
    profit?: string;
  };
  products: CashSalesReportProduct[];
  highlights: {
    abc: Record<AbcClass, CashSalesReportAbcBucket>;
    mostProfit?: CashSalesReportHighlight | null;
    leastProfit?: CashSalesReportHighlight | null;
  };
}
