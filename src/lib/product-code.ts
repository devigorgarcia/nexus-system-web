// Formata os códigos de fornecedor de um produto pras listagens
// (2026-09-04): um link só mostra o código puro; vários mostram
// "código (fornecedor)" separados por " · " pra desambiguar.
export function formatProductCodes(
  links: { supplierName: string; supplierCode: string }[],
): string {
  if (links.length === 0) return "—";
  if (links.length === 1) return links[0].supplierCode;
  return links
    .map((link) => `${link.supplierCode} (${link.supplierName})`)
    .join(" · ");
}

// Linha secundária da coluna SKU nas listagens: EAN do fabricante + códigos
// de fornecedor, o que existir, separado por " · ". Vazio quando o produto
// não tem nenhum dos dois (a célula mostra só o SKU).
export function formatSecondaryCodes(product: {
  barcode: string | null;
  supplierProductLinks: { supplierName: string; supplierCode: string }[];
}): string {
  const parts: string[] = [];
  if (product.barcode) parts.push(`EAN ${product.barcode}`);
  const supplierCodes = formatProductCodes(product.supplierProductLinks);
  if (supplierCodes !== "—") parts.push(supplierCodes);
  return parts.join(" · ");
}
