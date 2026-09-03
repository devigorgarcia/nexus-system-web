// Espelha o `select`/resposta da API (nexus-api/src/sales) — T4.1/T4.7/T4.8.
export interface SaleItemView {
  id: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  product: {
    id: string;
    name: string;
    unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
  };
}

export type PaymentMethod = "DINHEIRO" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "PIX";

export interface SaleItemRecord {
  id: string;
  status: "PENDENTE" | "PAGO";
  paymentMethod: PaymentMethod | null;
  installments: number | null;
  paidAt: string | null;
  createdAt: string;
  vendedorId: string;
  vendedor: { id: string; name: string };
  items: SaleItemView[];
}

// Resposta extra de `POST /sales/:id/confirm-payment` (T4.8) — usada pro
// cupom (T4.9), nunca recalculada no frontend (o servidor já resolveu o
// acréscimo de parcelamento).
export interface ConfirmPaymentResult extends SaleItemRecord {
  total: string;
  totalWithSurcharge: string;
}

export interface SalesPage {
  items: SaleItemRecord[];
  total: number;
  page: number;
  pageSize: number;
}
