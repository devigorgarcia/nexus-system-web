export interface OnlineStoreConfig {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface OnlineProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  salePrice: string;
  stock: string;
  unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
}
