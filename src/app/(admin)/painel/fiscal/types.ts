export type TaxRegime = "SIMPLES" | "PRESUMIDO" | "REAL";
export type FiscalDocumentStatus = "PENDENTE" | "EMITIDO" | "ERRO";

export interface FiscalConfig {
  id: string;
  cnpj: string;
  ie: string;
  taxRegime: TaxRegime;
  estimatedRate: string;
}

export interface FiscalDocument {
  id: string;
  status: FiscalDocumentStatus;
  accessKey: string | null;
  protocol: string | null;
  estimatedTax: string | null;
  errorMessage: string | null;
  createdAt: string;
  sale: {
    id: string;
    paidAt: string | null;
    customer: { id: string; name: string } | null;
  };
}
