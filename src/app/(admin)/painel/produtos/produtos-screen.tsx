"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, ImagePlus, Pencil, Plus, Search } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { PageToolbar } from "@/components/page-toolbar";
import { QuickCreateDialog } from "@/components/quick-create-dialog";
import { SearchableSelect } from "@/components/searchable-select";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/money-input";
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
import { apiFetch, apiUpload, alertApiError, ApiError } from "@/lib/api-client";
import { formatSecondaryCodes } from "@/lib/product-code";import { cn } from "@/lib/utils";
import { searchCategories, searchSubcategories } from "@/lib/search-options";
import {
  UNIT_TYPE_LABELS,
  formatQuantity,
  priceFieldLabels,
  unitSuffix,
  type ProductUnitType,
} from "@/lib/unit-type";
import type { CategoryListItem } from "./categorias/types";
import type { SubcategoryListItem } from "./subcategorias/types";
import { useHasModule } from "@/lib/modules-context";
import type { ProductListItem, ProductsPage } from "./types";

const PAGE_SIZE = 10;

interface ProductFormState {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  imageUrl: string;
  costPrice: string;
  salePrice: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  minStock: string;
  storageInstructions: string;
  unitType: ProductUnitType;
  pricePerUnit: string;
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  sku: "",
  barcode: "",
  description: "",
  imageUrl: "",
  costPrice: "",
  salePrice: "",
  categoryId: "",
  categoryName: "",
  subcategoryId: "",
  subcategoryName: "",
  minStock: "",
  storageInstructions: "",
  unitType: "UNIDADE",
  pricePerUnit: "",
};

export function ProdutosScreen({ canSeeCost = false }: { canSeeCost?: boolean }) {
  const hasEstoque = useHasModule("estoque");
  const [productsPage, setProductsPage] = useState<ProductsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [categoryFilterLabel, setCategoryFilterLabel] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("");
  const [subcategoryFilterLabel, setSubcategoryFilterLabel] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createSubcategoryOpen, setCreateSubcategoryOpen] = useState(false);

  const fetchCategories = useCallback(
    (query: string) => searchCategories(query),
    [],
  );
  const fetchFormSubcategories = useCallback(
    (query: string) =>
      form.categoryId ? searchSubcategories(query, form.categoryId) : Promise.resolve([]),
    [form.categoryId],
  );
  const fetchFilterSubcategories = useCallback(
    (query: string) =>
      categoryFilter
        ? searchSubcategories(query, categoryFilter)
        : Promise.resolve([]),
    [categoryFilter],
  );

  async function uploadProductImage(file?: File) {
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

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void uploadProductImage(file);
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

    const productsData = await apiFetch<ProductsPage>(
      `/products?${params.toString()}`,
    );
    setProductsPage(productsData);
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

  function openCreateSheet() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setSheetOpen(true);
  }

  function openEditSheet(product: ProductListItem) {
    setForm({
      id: product.id,
      name: product.name,
      sku: product.sku ?? "",
      barcode: product.barcode ?? "",
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      costPrice: product.costPrice ?? "",
      salePrice:
        product.unitType === "UNIDADE"
          ? product.salePrice
          : (product.pricePerUnit ?? product.salePrice),
      categoryId: product.categoryId ?? "",
      categoryName: product.category?.name ?? "",
      subcategoryId: product.subcategoryId ?? "",
      subcategoryName: product.subcategory?.name ?? "",
      minStock: String(product.minStock ?? ""),
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
        // Vazio = não manda: no create a API gera o SKU sequencial; no
        // update, campo omitido não é tocado.
        barcode: form.barcode.trim() || undefined,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        ...(canSeeCost ? { costPrice: form.costPrice } : {}),
        salePrice: form.salePrice,
        categoryId: form.categoryId || undefined,
        subcategoryId: form.subcategoryId || undefined,
        ...(hasEstoque && form.minStock
          ? { minStock: Number(form.minStock) }
          : {}),
        storageInstructions: form.storageInstructions || undefined,
        unitType: form.unitType,
        pricePerUnit:
          form.unitType === "UNIDADE" ? undefined : form.salePrice,
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
      alertApiError(error, "Erro ao inativar.");
    }
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function handleCreateCategory(name: string) {
    const created = await apiFetch<CategoryListItem>("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setForm((prev) => ({
      ...prev,
      categoryId: created.id,
      categoryName: created.name,
      subcategoryId: "",
      subcategoryName: "",
    }));
  }

  async function handleCreateSubcategory(name: string) {
    if (!form.categoryId) return;
    const created = await apiFetch<SubcategoryListItem>("/subcategories", {
      method: "POST",
      body: JSON.stringify({ categoryId: form.categoryId, name }),
    });
    setForm((prev) => ({
      ...prev,
      subcategoryId: created.id,
      subcategoryName: created.name,
    }));
  }

  const totalPages = productsPage
    ? Math.max(1, Math.ceil(productsPage.total / productsPage.pageSize))
    : 1;

  return (
    <div>
      <PageHeader
        title="Produtos"
        description={
          hasEstoque
            ? "Cadastro, preço e estoque do que a loja vende."
            : "Cadastro e preço do que a loja vende."
        }
        actions={
          <Button onClick={openCreateSheet}>
            <Plus className="size-3.5" />
            Novo produto
          </Button>
        }
      />

      <PageBody>
      <PageToolbar>
        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full min-w-0 items-center gap-2 sm:w-auto"
        >
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 sm:w-56"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Buscar
          </Button>
        </form>

        <SearchableSelect
          size="sm"
          className="w-full sm:w-48"
          aria-label="Filtrar por categoria"
          value={categoryFilter}
          valueLabel={categoryFilterLabel}
          fetchOptions={fetchCategories}
          placeholder="Todas as categorias"
          emptyOption={{ value: "", label: "Todas as categorias" }}
          onChange={(value, option) => {
            setPage(1);
            setCategoryFilter(value);
            setCategoryFilterLabel(value ? (option?.label ?? "") : "");
            setSubcategoryFilter("");
            setSubcategoryFilterLabel("");
          }}
        />

        {categoryFilter && (
          <SearchableSelect
            size="sm"
            className="w-full sm:w-48"
            aria-label="Filtrar por subcategoria"
            value={subcategoryFilter}
            valueLabel={subcategoryFilterLabel}
            fetchOptions={fetchFilterSubcategories}
            placeholder="Todas as subcategorias"
            emptyOption={{ value: "", label: "Todas as subcategorias" }}
            onChange={(value, option) => {
              setPage(1);
              setSubcategoryFilter(value);
              setSubcategoryFilterLabel(value ? (option?.label ?? "") : "");
            }}
          />
        )}
      </PageToolbar>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Categoria</TableHead>
            {canSeeCost ? <TableHead>Custo</TableHead> : null}
            <TableHead>Venda</TableHead>
            {hasEstoque ? <TableHead>Estoque</TableHead> : null}
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!loading && productsPage?.items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={(hasEstoque ? 6 : 5) + (canSeeCost ? 1 : 0)}
                className="text-center text-muted-foreground"
              >
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          )}
          {productsPage?.items.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-[10px] text-muted-foreground">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      "—"
                    )}
                  </div>
                  <span className="font-medium">{product.name}</span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div>{product.sku ?? "—"}</div>
                {formatSecondaryCodes(product) && (
                  <div className="text-xs text-muted-foreground">
                    {formatSecondaryCodes(product)}
                  </div>
                )}
              </TableCell>
              <TableCell>{product.category?.name ?? "Sem categoria"}</TableCell>
              {canSeeCost ? (
                <TableCell>
                  {product.costPrice ? `R$ ${product.costPrice}` : "—"}
                </TableCell>
              ) : null}
              <TableCell>R$ {product.salePrice}</TableCell>
              {hasEstoque ? (
                <TableCell>
                  {formatQuantity(product.stock ?? "0", product.unitType)}
                </TableCell>
              ) : null}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditSheet(product)}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleDelete(product)}
                  >
                    <Ban className="size-3.5" />
                    Inativar
                  </Button>
                </div>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="product-sku">SKU (código interno)</Label>
                <Input
                  id="product-sku"
                  value={form.id ? form.sku : ""}
                  placeholder="Gerado automaticamente"
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Sequencial da loja, gerado ao salvar.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="product-barcode">Código de barras</Label>
                <Input
                  id="product-barcode"
                  value={form.barcode}
                  placeholder="Bipe ou digite o EAN"
                  inputMode="numeric"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, barcode: e.target.value }))
                  }
                />
              </div>
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-unit-type">Unidade de venda</Label>
              <Select
                value={form.unitType}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    unitType:
                      (value as ProductFormState["unitType"]) ?? "UNIDADE",
                    pricePerUnit:
                      value === "UNIDADE" ? "" : prev.salePrice,
                  }))
                }
              >
                <SelectTrigger id="product-unit-type" className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      UNIT_TYPE_LABELS[value as keyof typeof UNIT_TYPE_LABELS] ??
                      value}
                  </SelectValue>
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

            <div className="flex gap-3">
              {canSeeCost ? (
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="product-cost">
                    {priceFieldLabels(form.unitType).cost}
                  </Label>
                  <MoneyInput
                    id="product-cost"
                    value={form.costPrice}
                    onChange={(costPrice) =>
                      setForm((prev) => ({ ...prev, costPrice }))
                    }
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="product-sale">
                  {priceFieldLabels(form.unitType).sale}
                </Label>
                <MoneyInput
                  id="product-sale"
                  value={form.salePrice}
                  onChange={(salePrice) =>
                    setForm((prev) => ({
                      ...prev,
                      salePrice,
                      pricePerUnit:
                        prev.unitType === "UNIDADE" ? "" : salePrice,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-category">Categoria</Label>
              <SearchableSelect
                id="product-category"
                value={form.categoryId}
                valueLabel={form.categoryName}
                fetchOptions={fetchCategories}
                placeholder="Sem categoria"
                emptyOption={{ value: "", label: "Sem categoria" }}
                createLabel="Criar categoria"
                onCreate={() => setCreateCategoryOpen(true)}
                onChange={(value, option) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryId: value,
                    categoryName: value ? (option?.label ?? "") : "",
                    subcategoryId: "",
                    subcategoryName: "",
                  }))
                }
              />
            </div>

            {form.categoryId && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="product-subcategory">
                  Subcategoria (opcional)
                </Label>
                <SearchableSelect
                  id="product-subcategory"
                  value={form.subcategoryId}
                  valueLabel={form.subcategoryName}
                  fetchOptions={fetchFormSubcategories}
                  placeholder="Sem subcategoria"
                  emptyOption={{ value: "", label: "Sem subcategoria" }}
                  createLabel="Criar subcategoria"
                  onCreate={() => setCreateSubcategoryOpen(true)}
                  onChange={(value, option) =>
                    setForm((prev) => ({
                      ...prev,
                      subcategoryId: value,
                      subcategoryName: value ? (option?.label ?? "") : "",
                    }))
                  }
                />
              </div>
            )}

            {hasEstoque ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-min-stock">
                {unitSuffix(form.unitType)
                  ? `Estoque mínimo (${unitSuffix(form.unitType)})`
                  : "Estoque mínimo"}
              </Label>
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
            ) : null}

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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-image">Imagem (opcional)</Label>
              <label
                htmlFor="product-image"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (uploadingImage) return;
                  void uploadProductImage(event.dataTransfer.files[0]);
                }}
                className={cn(
                  "relative flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-primary/45 bg-accent/50 px-4 py-5 text-center transition-colors hover:border-primary hover:bg-accent",
                  uploadingImage && "pointer-events-none opacity-70",
                )}
              >
                {form.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- URL vem da própria API (T3.13). */}
                    <img
                      src={form.imageUrl}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                    <span className="relative z-10 rounded-md bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm">
                      Clique para trocar a imagem
                    </span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="mb-2 size-8 text-primary" />
                    <span className="text-sm font-semibold">
                      {uploadingImage
                        ? "Enviando imagem…"
                        : "Clique para adicionar imagem"}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      Ou arraste o arquivo aqui · PNG, JPG ou WebP
                    </span>
                  </>
                )}
                <input
                  id="product-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                  className="sr-only"
                />
              </label>
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
                (canSeeCost && !form.costPrice) ||
                !form.salePrice
              }
            >
              Salvar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <QuickCreateDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        title="Nova categoria"
        placeholder="Ex.: Velas aromáticas"
        onSubmit={handleCreateCategory}
      />
      <QuickCreateDialog
        open={createSubcategoryOpen}
        onOpenChange={setCreateSubcategoryOpen}
        title={
          form.categoryName
            ? `Nova subcategoria em ${form.categoryName}`
            : "Nova subcategoria"
        }
        placeholder="Ex.: Floral"
        onSubmit={handleCreateSubcategory}
      />
      </PageBody>
    </div>
  );
}
