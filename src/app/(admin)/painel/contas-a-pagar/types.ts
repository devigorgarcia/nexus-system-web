export interface PayableInstallment {
  id: string;
  number: number;
  dueDate: string;
  amount: string;
  status: "PENDENTE" | "PAGO";
  paidAt: string | null;
}

export interface AccountPayable {
  id: string;
  supplierName: string;
  description: string;
  totalAmount: string;
  createdAt: string;
  installments: PayableInstallment[];
}

export interface PayablesPage {
  items: AccountPayable[];
  total: number;
  page: number;
  pageSize: number;
}
