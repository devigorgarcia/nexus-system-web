export interface PurchaseItem {
  id: string;
  productId: string;
  quantityOrdered: string;
  quantityReceived: string | null;
  unitCost: string;
  product: { id: string; name: string };
}

export interface PurchaseListItem {
  id: string;
  status: "PENDENTE" | "RECEBIDA" | "CANCELADA";
  createdAt: string;
  receivedAt: string | null;
  supplier: { id: string; name: string };
  items: PurchaseItem[];
}

export interface SupplierOption {
  id: string;
  name: string;
  active: boolean;
}
