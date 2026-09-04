// Espelha `GET /products/search` (T4.3) e `GET /sales/top-products` (T4.5).
export interface SearchResultItem {
  id: string;
  name: string;
  // SKU/código de barras (2026-09-04) — a busca casa exato nesses campos
  // além do nome; o PDV usa pra adicionar direto ao carrinho num bip.
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
  stock: string;
  regularPrice: string;
  effectivePrice: string;
  priceSource: "combo" | "promotion" | "base";
}

export interface TopProductItem {
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    salePrice: string;
    unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
    pricePerUnit: string | null;
  };
  quantitySold: string;
}

// Linha do carrinho local (T4.4) — preço já resolvido no momento em que o
// produto foi adicionado (T4.6/T4.10); `POST /sales` (T4.2) resolve de novo
// no servidor no momento da criação, então uma promoção que expira entre
// "adicionar ao carrinho" e "finalizar venda" nunca fica desatualizada no
// que é cobrado — só no que é exibido no carrinho até então.
export interface CartLine {
  productId: string;
  name: string;
  imageUrl: string | null;
  unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
  quantity: string;
  unitPrice: string;
  onPromotion: boolean;
}

export interface CreatedSale {
  id: string;
  status: string;
}
