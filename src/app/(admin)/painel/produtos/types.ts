// Espelha o `select`/formato de resposta da API (palacio-velas-api/src/products) —
// T3.3/T3.5. `costPrice` só existe na resposta quando o backend decide incluir
// (canSeeCost, T3.3) — nesta tela só entra quem tem essa permissão (page.tsx),
// então na prática sempre vem preenchido aqui.
export interface ProductListItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  salePrice: string;
  costPrice?: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  subcategoryId: string | null;
  subcategory: { id: string; name: string } | null;
  minStock: number;
  stock: number;
  storageInstructions: string | null;
  unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
  pricePerUnit: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsPage {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}
