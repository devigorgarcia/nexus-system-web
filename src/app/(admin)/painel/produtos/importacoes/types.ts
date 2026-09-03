// Espelha `PENDING_SELECT`/resposta da API (nexus-api/src/product-imports) —
// T3.8/T3.9.
export interface ImportSummary {
  totalRows: number;
  stockUpdated: number;
  pendingCreated: number;
}

export interface PendingImportItem {
  id: string;
  kind: "PRODUTO_NOVO" | "CUSTO_ALTERADO";
  status: "PENDENTE" | "CONFIRMADO" | "REJEITADO";
  supplierName: string;
  supplierCode: string | null;
  supplierRawName: string;
  cost: string;
  quantity: number;
  existingProduct: { id: string; name: string; costPrice: string } | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface PendingImportsPage {
  items: PendingImportItem[];
  total: number;
  page: number;
  pageSize: number;
}
