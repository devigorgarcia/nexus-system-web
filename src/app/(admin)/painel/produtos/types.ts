// Espelha o `select`/formato de resposta da API (nexus-api/src/products) —
// T3.3/T3.5. `costPrice` só existe na resposta quando o backend decide incluir
// (canSeeCost, T3.3) — nesta tela só entra quem tem essa permissão (page.tsx),
// então na prática sempre vem preenchido aqui.
export interface ProductListItem {
  id: string;
  name: string;
  // SKU interno sequencial (sempre presente em produto criado depois de
  // 2026-09-04; backfill cobriu os antigos) e EAN do fabricante, opcional.
  sku: string | null;
  barcode: string | null;
  description: string | null;
  imageUrl: string | null;
  salePrice: string;
  costPrice?: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  subcategoryId: string | null;
  subcategory: { id: string; name: string } | null;
  minStock: number;
  // String, não number (T4.11) — `Product.stock` virou `Decimal` no backend
  // (produto vendido por peso/metro/volume aceita saldo fracionário), mesmo
  // padrão de `salePrice`/`costPrice` acima.
  stock: string;
  storageInstructions: string | null;
  unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
  pricePerUnit: string | null;
  active: boolean;
  // Códigos de fornecedor (SupplierProductLink, T3.8) — um por fornecedor
  // que já importou planilha com esse produto; vazio se nunca veio de
  // importação. Exibido nas listagens (2026-09-04).
  supplierProductLinks: { supplierName: string; supplierCode: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductsPage {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}
