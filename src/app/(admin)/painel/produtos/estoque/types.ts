// Espelha `stockSummary()`/`select` da API (nexus-api/src/products,
// src/stock-movements) — T3.7.
export interface StockSummary {
  itemsCount: number;
  lowStockCount: number;
  stockValue: number;
}

export interface StockMovementItem {
  id: string;
  type: "ENTRADA" | "SAIDA";
  // String, não number (T4.11) — `StockMovement.quantity` virou `Decimal`.
  quantity: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
  };
  user: { id: string; name: string };
}

export interface StockMovementsPage {
  items: StockMovementItem[];
  total: number;
  page: number;
  pageSize: number;
}
