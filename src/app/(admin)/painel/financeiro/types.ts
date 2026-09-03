// Espelha o `select`/resposta da API (nexus-api/src/finance) — T5.1/T5.3/T5.4/T5.5.
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
}

export interface CashRegistersPage {
  items: CashRegisterItem[];
  total: number;
  page: number;
  pageSize: number;
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
  cogs: string;
  margin: string;
}
