// Espelha o `select` implícito da API (palacio-velas-api/src/subcategories) — T3.17/T3.18.
export interface SubcategoryListItem {
  id: string;
  categoryId: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
