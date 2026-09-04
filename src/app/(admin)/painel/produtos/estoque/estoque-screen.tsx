"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRightLeft, Plus } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { PageToolbar } from "@/components/page-toolbar";
import { QuantityInput } from "@/components/quantity-input";
import { SearchableSelect } from "@/components/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  searchCategories,
  searchProducts,
  searchSubcategories,
} from "@/lib/search-options";
import {
  formatQuantity,
  quantityFieldLabel,
  quantityToApi,
  type ProductUnitType,
} from "@/lib/unit-type";
import type { ProductListItem, ProductsPage } from "../types";
import type {
  StockMovementItem,
  StockMovementsPage,
  StockSummary,
} from "./types";

const PAGE_SIZE = 10;
const TODOS_TIPOS = "__todos_tipos__";

type StockStatus = "ok" | "baixo" | "crítico";

function statusFor(product: ProductListItem): StockStatus {
  // `stock` é string (T4.11, Decimal no backend) — sempre comparar como
  // número, nunca com o literal `"0"`/`< minStock` direto na string.
  const stock = Number(product.stock);
  if (stock === 0) return "crítico";
  if (stock < product.minStock) return "baixo";
  return "ok";
}

function statusBadgeClass(status: StockStatus) {
  if (status === "crítico") return "bg-critical text-critical-foreground";
  if (status === "baixo") return "bg-warning text-warning-foreground";
  return "bg-success text-success-foreground";
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

interface MovementFormState {
  productId: string;
  productName: string;
  unitType: ProductUnitType;
  type: "ENTRADA" | "SAIDA";
  quantity: string;
}

const EMPTY_MOVEMENT_FORM: MovementFormState = {
  productId: "",
  productName: "",
  unitType: "UNIDADE",
  type: "ENTRADA",
  quantity: "",
};

export function EstoqueScreen() {
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [balancePage, setBalancePage] = useState<ProductsPage | null>(null);
  const [balancePageNum, setBalancePageNum] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categoryFilterLabel, setCategoryFilterLabel] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [subcategoryFilterLabel, setSubcategoryFilterLabel] = useState("");

  const [movementsPage, setMovementsPage] = useState<StockMovementsPage | null>(
    null,
  );
  const [movementPageNum, setMovementPageNum] = useState(1);
  const [movementProductFilter, setMovementProductFilter] = useState("");
  const [movementProductLabel, setMovementProductLabel] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("");
  const [movementFrom, setMovementFrom] = useState("");
  const [movementTo, setMovementTo] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<MovementFormState>(EMPTY_MOVEMENT_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reloadSummaryAndBalance() {
    const balanceParams = new URLSearchParams({
      page: String(balancePageNum),
      pageSize: String(PAGE_SIZE),
      active: "true",
    });
    if (categoryFilter) balanceParams.set("categoryId", categoryFilter);
    if (subcategoryFilter)
      balanceParams.set("subcategoryId", subcategoryFilter);

    const [summaryData, balanceData] = await Promise.all([
      apiFetch<StockSummary>("/products/stock-summary"),
      apiFetch<ProductsPage>(`/products?${balanceParams.toString()}`),
    ]);
    setSummary(summaryData);
    setBalancePage(balanceData);
  }

  async function reloadMovements() {
    const params = new URLSearchParams({
      page: String(movementPageNum),
      pageSize: String(PAGE_SIZE),
    });
    if (movementProductFilter) params.set("productId", movementProductFilter);
    if (movementTypeFilter) params.set("type", movementTypeFilter);
    if (movementFrom) params.set("from", new Date(movementFrom).toISOString());
    if (movementTo) params.set("to", new Date(movementTo).toISOString());

    const data = await apiFetch<StockMovementsPage>(
      `/stock-movements?${params.toString()}`,
    );
    setMovementsPage(data);
  }

  useEffect(() => {
    // Carga/recarga a cada mudança de página ou filtro — sem lib de
    // data-fetching no projeto, padrão aceito de "buscar ao montar/mudar"
    // (react.dev/learn/you-might-not-need-an-effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reloadSummaryAndBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balancePageNum, categoryFilter, subcategoryFilter]);

  const fetchFilterSubcategories = useCallback(
    (query: string) =>
      categoryFilter
        ? searchSubcategories(query, categoryFilter)
        : Promise.resolve([]),
    [categoryFilter],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reloadMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movementPageNum, movementProductFilter, movementTypeFilter, movementFrom, movementTo]);

  function openMovementDialog(productId?: string) {
    const product = balancePage?.items.find((item) => item.id === productId);
    setForm({
      ...EMPTY_MOVEMENT_FORM,
      productId: productId ?? "",
      productName: product?.name ?? "",
      unitType: product?.unitType ?? "UNIDADE",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSaveMovement() {
    setSaving(true);
    setFormError(null);
    try {
      await apiFetch("/stock-movements", {
        method: "POST",
        body: JSON.stringify({
          productId: form.productId,
          type: form.type,
          // String, não `Number(...)` (T4.11) — `CreateStockMovementDto.
          // quantity` virou um padrão decimal (produto vendido por peso/
          // metro/volume aceita fração), mesmo formato de `costPrice`/
          // `salePrice` já usado no formulário de Produtos.
          quantity: quantityToApi(form.quantity),
        }),
      });
      setDialogOpen(false);
      // Saldo/resumo/histórico refletem a movimentação sem reload de página
      // (spec.md §7 — nunca um reload manual pro usuário ver o efeito).
      await Promise.all([reloadSummaryAndBalance(), reloadMovements()]);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Erro ao lançar.",
      );
    } finally {
      setSaving(false);
    }
  }

  const balanceTotalPages = balancePage
    ? Math.max(1, Math.ceil(balancePage.total / balancePage.pageSize))
    : 1;
  const movementsTotalPages = movementsPage
    ? Math.max(1, Math.ceil(movementsPage.total / movementsPage.pageSize))
    : 1;

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Saldo por produto e histórico de movimentações."
        actions={
          <Button onClick={() => openMovementDialog()}>
            <Plus className="size-3.5" />
            Nova movimentação
          </Button>
        }
      />

      <PageBody>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Itens cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary?.itemsCount ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Com estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary?.lowStockCount ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Valor em estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? formatCurrency(summary.stockValue) : "—"}
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 font-heading text-lg">Saldo por produto</h2>
      <PageToolbar>
          <SearchableSelect
            size="sm"
            className="w-full sm:w-48"
            aria-label="Filtrar saldo por categoria"
            value={categoryFilter}
            valueLabel={categoryFilterLabel}
            fetchOptions={searchCategories}
            placeholder="Todas as categorias"
            emptyOption={{ value: "", label: "Todas as categorias" }}
            onChange={(value, option) => {
              setBalancePageNum(1);
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
              aria-label="Filtrar saldo por subcategoria"
              value={subcategoryFilter}
              valueLabel={subcategoryFilterLabel}
              fetchOptions={fetchFilterSubcategories}
              placeholder="Todas as subcategorias"
              emptyOption={{ value: "", label: "Todas as subcategorias" }}
              onChange={(value, option) => {
                setBalancePageNum(1);
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
            <TableHead>Categoria</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Mínimo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balancePage?.items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          )}
          {balancePage?.items.map((product) => {
            const status = statusFor(product);
            return (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>
                  {product.category?.name ?? "Sem categoria"}
                </TableCell>
                <TableCell>
                  {formatQuantity(product.stock, product.unitType)}
                </TableCell>
                <TableCell>
                  {formatQuantity(product.minStock, product.unitType)}
                </TableCell>
                <TableCell>
                  <Badge className={statusBadgeClass(status)}>{status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openMovementDialog(product.id)}
                  >
                    <ArrowRightLeft className="size-3.5" />
                    Movimentar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="mt-3 mb-8 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {balancePage?.page ?? 1} de {balanceTotalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={balancePageNum <= 1}
            onClick={() => setBalancePageNum((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={balancePageNum >= balanceTotalPages}
            onClick={() => setBalancePageNum((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>

      <h2 className="mb-3 font-heading text-lg">Histórico de movimentações</h2>
      <PageToolbar>
        <SearchableSelect
          size="sm"
          className="w-full sm:w-48"
          aria-label="Filtrar histórico por produto"
          value={movementProductFilter}
          valueLabel={movementProductLabel}
          fetchOptions={searchProducts}
          placeholder="Todos os produtos"
          emptyOption={{ value: "", label: "Todos os produtos" }}
          onChange={(value, option) => {
            setMovementPageNum(1);
            setMovementProductFilter(value);
            setMovementProductLabel(value ? (option?.label ?? "") : "");
          }}
        />

        <Select
          value={movementTypeFilter || undefined}
          onValueChange={(value) => {
            setMovementPageNum(1);
            setMovementTypeFilter(value === TODOS_TIPOS ? "" : (value ?? ""));
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-full sm:w-40"
            aria-label="Filtrar histórico por tipo"
          >
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS_TIPOS}>Todos os tipos</SelectItem>
            <SelectItem value="ENTRADA">Entrada</SelectItem>
            <SelectItem value="SAIDA">Saída</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Label htmlFor="movement-from" className="text-sm">
            De
          </Label>
          <Input
            id="movement-from"
            type="date"
            className="w-full sm:w-40"
            value={movementFrom}
            onChange={(e) => {
              setMovementPageNum(1);
              setMovementFrom(e.target.value);
            }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Label htmlFor="movement-to" className="text-sm">
            Até
          </Label>
          <Input
            id="movement-to"
            type="date"
            className="w-full sm:w-40"
            value={movementTo}
            onChange={(e) => {
              setMovementPageNum(1);
              setMovementTo(e.target.value);
            }}
          />
        </div>
      </PageToolbar>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movementsPage?.items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Nenhuma movimentação encontrada.
              </TableCell>
            </TableRow>
          )}
          {movementsPage?.items.map((movement) => (
            <MovementRow key={movement.id} movement={movement} />
          ))}
        </TableBody>
      </Table>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {movementsPage?.page ?? 1} de {movementsTotalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={movementPageNum <= 1}
            onClick={() => setMovementPageNum((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={movementPageNum >= movementsTotalPages}
            onClick={() => setMovementPageNum((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova movimentação</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="movement-product">Produto</Label>
              <SearchableSelect
                id="movement-product"
                value={form.productId}
                valueLabel={form.productName}
                fetchOptions={searchProducts}
                placeholder="Selecione um produto"
                onChange={(value, option) =>
                  setForm((prev) => ({
                    ...prev,
                    productId: value,
                    productName: option?.label ?? "",
                    unitType: option?.unitType ?? "UNIDADE",
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="movement-type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    type: (value as "ENTRADA" | "SAIDA") ?? "ENTRADA",
                  }))
                }
              >
                <SelectTrigger id="movement-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SAIDA">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="movement-quantity">
                {quantityFieldLabel(form.unitType)}
              </Label>
              <QuantityInput
                id="movement-quantity"
                unitType={form.unitType}
                value={form.quantity}
                onChange={(quantity) =>
                  setForm((prev) => ({ ...prev, quantity }))
                }
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => void handleSaveMovement()}
              disabled={saving || !form.productId || !form.quantity}
            >
              Lançar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </PageBody>
    </div>
  );
}

function MovementRow({ movement }: { movement: StockMovementItem }) {
  return (
    <TableRow>
      <TableCell>{movement.product.name}</TableCell>
      <TableCell>
        {movement.type === "ENTRADA" ? "Entrada" : "Saída"}
      </TableCell>
      <TableCell>
        {formatQuantity(movement.quantity, movement.product.unitType)}
      </TableCell>
      <TableCell>{movement.user.name}</TableCell>
      <TableCell>
        {new Date(movement.createdAt).toLocaleString("pt-BR")}
      </TableCell>
    </TableRow>
  );
}
