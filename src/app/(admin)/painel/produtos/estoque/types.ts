// Espelha `stockSummary()`/`select` da API (palacio-velas-api/src/products,
// src/stock-movements) — T3.7.
export interface StockSummary {
  itemsCount: number;
  lowStockCount: number;
  stockValue: number;
}

export interface StockMovementItem {
  id: string;
  type: "ENTRADA" | "SAIDA";
  quantity: number;
  createdAt: string;
  product: { id: string; name: string };
  user: { id: string; name: string };
}

export interface StockMovementsPage {
  items: StockMovementItem[];
  total: number;
  page: number;
  pageSize: number;
}
