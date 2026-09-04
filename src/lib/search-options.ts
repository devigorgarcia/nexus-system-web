import { apiFetch } from "@/lib/api-client";
import type { SearchableOption } from "@/components/searchable-select";
import type { ProductUnitType } from "@/lib/unit-type";

type NamedItem = { id: string; name: string; unitType?: ProductUnitType };

function toOptions(items: NamedItem[]): SearchableOption[] {
  return items.map((item) => ({ value: item.id, label: item.name }));
}

function withQuery(path: string, query: string, extra?: Record<string, string>) {
  const params = new URLSearchParams(extra);
  if (query.trim()) params.set("q", query.trim());
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function searchCategories(query: string, active = true) {
  return apiFetch<NamedItem[]>(
    withQuery("/categories", query, active ? { active: "true" } : undefined),
  ).then(toOptions);
}

export function searchSubcategories(
  query: string,
  categoryId: string,
  active = true,
) {
  return apiFetch<NamedItem[]>(
    withQuery("/subcategories", query, {
      categoryId,
      ...(active ? { active: "true" } : {}),
    }),
  ).then(toOptions);
}

export function searchCustomers(query: string) {
  return apiFetch<NamedItem[]>(
    withQuery("/customers", query, { active: "true" }),
  ).then(toOptions);
}

export function searchSuppliers(query: string) {
  return apiFetch<NamedItem[]>(
    withQuery("/suppliers", query, { active: "true" }),
  ).then(toOptions);
}

export function searchProducts(query: string) {
  const params = new URLSearchParams({ active: "true", pageSize: "30" });
  if (query.trim()) params.set("search", query.trim());
  return apiFetch<{ items: NamedItem[] }>(`/products?${params.toString()}`).then(
    (page) =>
      page.items.map((item) => ({
        value: item.id,
        label: item.name,
        unitType: item.unitType,
      })),
  );
}
