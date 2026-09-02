"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, apiUpload, ApiError } from "@/lib/api-client";
import type { CategoryListItem } from "./categorias/types";
import type { SubcategoryListItem } from "./subcategorias/types";
import type { ProductListItem, ProductsPage } from "./types";

const PAGE_SIZE = 10;

interface ProductFormState {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  costPrice: string;
  salePrice: string;
  categoryId: string;
  subcategoryId: string;
  minStock: string;
  storageInstructions: string;
  unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
  pricePerUnit: string;
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  description: "",
  imageUrl: "",
  costPrice: "",
  salePrice: "",
  categoryId: "",
  subcategoryId: "",
  minStock: "",
  storageInstructions: "",
  unitType: "UNIDADE",
  pricePerUnit: "",
};

const UNIT_TYPE_LABELS: Record<ProductFormState["unitType"], string> = {
  UNIDADE: "Unidade",
  METRO: "Metro",
  PESO: "Peso",
  VOLUME: "Volume",
};

const NO_CATEGORY = "__sem_categoria__";
const NO_SUBCATEGORY = "__sem_subcategoria__";

export function ProdutosScreen() {
  const [productsPage, setProductsPage] = useState<ProductsPage | null>(null);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [subcategories, setSubcategories] = useState<SubcategoryListItem[]>(
    [],
  );
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formSubcategories, setFormSubcategories] = useState<
    SubcategoryListItem[]
  >([]);

  useEffect(() => {
    if (!sheetOpen || !form.categoryId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormSubcategories([]);
      return;
    }
    void apiFetch<SubcategoryListItem[]>(
      `/subcategories?categoryId=${form.categoryId}&active=true`,
    ).then(setFormSubcategories);
  }, [sheetOpen, form.categoryId]);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);
    try {
      const uploaded = await apiUpload<{ url: string }>(
        "/product-images",
        (() => {
          const data = new FormData();
          data.set("file", file);
          return data;
        })(),
      );
      setForm((prev) => ({ ...prev, imageUrl: uploaded.url }));
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Erro ao enviar imagem.",
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function reload() {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (categoryFilter) params.set("categoryId", categoryFilter);
    if (subcategoryFilter) params.set("subcategoryId", subcategoryFilter);
    if (search) params.set("search", search);

    const [productsData, categoriesData] = await Promise.all([
      apiFetch<ProductsPage>(`/products?${params.toString()}`),
      apiFetch<CategoryListItem[]>("/categories?active=true"),
    ]);
    setProductsPage(productsData);
    setCategories(categoriesData);
    setLoading(false);
  }

  useEffect(() => {
    // Carga inicial e recarga a cada mudança de página/filtro — sem lib de
    // data-fetching no projeto, padrão aceito de "buscar ao montar/mudar"
    // (react.dev/learn/you-might-not-need-an-effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryFilter, subcategoryFilter, search]);

  useEffect(() => {
    // Subcategoria depende da categoria escolhida (T3.18, mesmo padrão do
    // cadastro de produto) — sem categoria selecionada, filtro de
    // subcategoria some.
    if (!categoryFilter) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubcategories([]);
      setSubcategoryFilter("");
      return;
    }
    void apiFetch<SubcategoryListItem[]>(
      `/subcategories?categoryId=${categoryFilter}&active=true`,
    ).then(setSubcategories);
    setSubcategoryFilter("");
  }, [categoryFilter]);

  function openCreateSheet() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setSheetOpen(true);
  }

  function openEditSheet(product: ProductListItem) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      costPrice: product.costPrice ?? "",
      salePrice: product.salePrice,
      categoryId: product.categoryId ?? "",
      subcategoryId: product.subcategoryId ?? "",
      minStock: String(product.minStock),
      storageInstructions: product.storageInstructions ?? "",
      unitType: product.unitType,
      pricePerUnit: product.pricePerUnit ?? "",
    });
    setFormError(null);
    setSheetOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        costPrice: form.costPrice,
        salePrice: form.salePrice,
        categoryId: form.categoryId || undefined,
        subcategoryId: form.subcategoryId || undefined,
        minStock: form.minStock ? Number(form.minStock) : undefined,
        storageInstructions: form.storageInstructions || undefined,
        unitType: form.unitType,
        pricePerUnit:
          form.unitType === "UNIDADE" ? undefined : form.pricePerUnit,
      };

      if (form.id) {
        // `categoryId` vazio no form, em edição, significa "remover
        // categoria" — a API distingue `undefined` (não mexe) de `null`
        // (remove), então só nesse caso manda `null` explícito.
        if (!form.categoryId) {
          body.categoryId = null;
        }
        if (!form.subcategoryId) {
          body.subcategoryId = null;
        }
        await apiFetch(`/products/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setSheetOpen(false);
      await reload();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Erro ao salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: ProductListItem) {
    if (!confirm(`Inativar o produto "${product.name}"?`)) {
      return;
    }
    try {
      await apiFetch(`/products/${product.id}`, { method: "DELETE" });
      await reload();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Erro ao inativar.");
    }
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const totalPages = productsPage
    ? Math.max(1, Math.ceil(productsPage.total / productsPage.pageSize))
    : 1;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl">Produtos</h1>
        <Button onClick={openCreateSheet}>+ Novo produto</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nome…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-56"
          />
          <Button type="submit" variant="secondary" size="sm">
            Buscar
          </Button>
        </form>

        <Select
          value={categoryFilter || undefined}
          onValueChange={(value) => {
            setPage(1);
            setCategoryFilter(value === "__todas__" ? "" : (value ?? ""));
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-48"
            aria-label="Filtrar por categoria"
          >
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__todas__">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {categoryFilter && subcategories.length > 0 && (
          <Select
            value={subcategoryFilter || undefined}
            onValueChange={(value) => {
              setPage(1);
              setSubcategoryFilter(
                value === "__todas_sub__" ? "" : (value ?? ""),
              );
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-48"
              aria-label="Filtrar por subcategoria"
            >
              <SelectValue placeholder="Todas as subcategorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__todas_sub__">
                Todas as subcategorias
              </SelectItem>
              {subcategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead>Venda</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!loading && productsPage?.items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          )}
          {productsPage?.items.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.category?.name ?? "Sem categoria"}</TableCell>
              <TableCell>
                {product.costPrice ? `R$ ${product.costPrice}` : "—"}
              </TableCell>
              <TableCell>R$ {product.salePrice}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditSheet(product)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(product)}
                >
                  Inativar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {productsPage?.page ?? 1} de {totalPages} ·{" "}
          {productsPage?.total ?? 0} produto(s)
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[380px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {form.id ? "Editar produto" : "Novo produto"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-3 px-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-name">Nome</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-description">Descrição</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="product-cost">Custo (R$)</Label>
                <Input
                  id="product-cost"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      costPrice: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="product-sale">Venda (R$)</Label>
                <Input
                  id="product-sale"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.salePrice}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      salePrice: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-category">Categoria</Label>
              <Select
                value={form.categoryId || NO_CATEGORY}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryId: value === NO_CATEGORY ? "" : (value ?? ""),
                    // Subcategoria depende da categoria (T3.18) — trocar de
                    // categoria invalida a subcategoria escolhida antes.
                    subcategoryId: "",
                  }))
                }
              >
                <SelectTrigger id="product-category" className="w-full">
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>Sem categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.categoryId && formSubcategories.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="product-subcategory">
                  Subcategoria (opcional)
                </Label>
                <Select
                  value={form.subcategoryId || NO_SUBCATEGORY}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      subcategoryId:
                        value === NO_SUBCATEGORY ? "" : (value ?? ""),
                    }))
                  }
                >
                  <SelectTrigger id="product-subcategory" className="w-full">
                    <SelectValue placeholder="Sem subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SUBCATEGORY}>
                      Sem subcategoria
                    </SelectItem>
                    {formSubcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-min-stock">Estoque mínimo</Label>
              <Input
                id="product-min-stock"
                type="number"
                min={0}
                placeholder="5"
                value={form.minStock}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, minStock: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-storage">
                Armazenamento (opcional)
              </Label>
              <Input
                id="product-storage"
                placeholder="Ex.: manter refrigerado"
                value={form.storageInstructions}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    storageInstructions: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="product-unit-type">Unidade de venda</Label>
                <Select
                  value={form.unitType}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      unitType:
                        (value as ProductFormState["unitType"]) ?? "UNIDADE",
                      // Voltar pra unidade limpa o preço por unidade — não
                      // faz sentido continuar preenchido escondido.
                      pricePerUnit:
                        value === "UNIDADE" ? "" : prev.pricePerUnit,
                    }))
                  }
                >
                  <SelectTrigger id="product-unit-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.unitType !== "UNIDADE" && (
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="product-price-per-unit">
                    Preço por {UNIT_TYPE_LABELS[form.unitType].toLowerCase()}{" "}
                    (R$)
                  </Label>
                  <Input
                    id="product-price-per-unit"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.pricePerUnit}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pricePerUnit: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-image">Imagem (opcional)</Label>
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- URL vem da própria API (T3.13), sem otimização do Next necessária aqui.
                <img
                  src={form.imageUrl}
                  alt=""
                  className="h-24 w-24 rounded-md border border-border object-cover"
                />
              )}
              <input
                id="product-image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => void handleImageChange(e)}
                disabled={uploadingImage}
                className="text-sm"
              />
              {uploadingImage && (
                <p className="text-sm text-muted-foreground">Enviando…</p>
              )}
            </div>

            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
          </div>

          <SheetFooter>
            <Button
              onClick={() => void handleSave()}
              disabled={
                saving ||
                uploadingImage ||
                !form.name ||
                !form.costPrice ||
                !form.salePrice ||
                (form.unitType !== "UNIDADE" && !form.pricePerUnit)
              }
            >
              Salvar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
