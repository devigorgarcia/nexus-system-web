export interface AccountReceivable {
  id: string;
  amount: string;
  feeAmount: string;
  netAmount: string;
  status: "PENDENTE" | "RECEBIDO";
  receivedAt: string | null;
  createdAt: string;
  sale: {
    id: string;
    paidAt: string | null;
    paymentMethod: string | null;
    installments: number | null;
    vendedor: { id: string; name: string };
  };
}

export interface ReceivablesPage {
  items: AccountReceivable[];
  total: number;
  page: number;
  pageSize: number;
}
