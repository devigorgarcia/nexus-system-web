"use client";

import { useEffect, useState } from "react";
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
import type { CategoryListItem } from "../categorias/types";
import type { SubcategoryListItem } from "../subcategorias/types";
import type { ProductListItem, ProductsPage } from "../types";
import type {
  StockMovementItem,
  StockMovementsPage,
  StockSummary,
} from "./types";

const PAGE_SIZE = 10;
const TODAS_CATEGORIAS = "__todas__";
const TODAS_SUBCATEGORIAS = "__todas_sub__";
const TODOS_PRODUTOS = "__todos__";
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
  type: "ENTRADA" | "SAIDA";
  quantity: string;
}

const EMPTY_MOVEMENT_FORM: MovementFormState = {
  productId: "",
  type: "ENTRADA",
  quantity: "",
};

export function EstoqueScreen() {
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [balancePage, setBalancePage] = useState<ProductsPage | null>(null);
  const [balancePageNum, setBalancePageNum] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategories, setSubcategories] = useState<SubcategoryListItem[]>(
    [],
  );
  const [subcategoryFilter, setSubcategoryFilter] = useState("");

  const [movementsPage, setMovementsPage] = useState<StockMovementsPage | null>(
    null,
  );
  const [movementPageNum, setMovementPageNum] = useState(1);
  const [movementProductFilter, setMovementProductFilter] = useState("");
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

    const [summaryData, categoriesData, balanceData] = await Promise.all([
      apiFetch<StockSummary>("/products/stock-summary"),
      apiFetch<CategoryListItem[]>("/categories?active=true"),
      apiFetch<ProductsPage>(`/products?${balanceParams.toString()}`),
    ]);
    setSummary(summaryData);
    setCategories(categoriesData);
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

  useEffect(() => {
    // Subcategoria depende da categoria escolhida (T3.18, mesmo padrão do
    // filtro de Produtos).
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reloadMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movementPageNum, movementProductFilter, movementTypeFilter, movementFrom, movementTo]);

  function openMovementDialog(productId?: string) {
    setForm({ ...EMPTY_MOVEMENT_FORM, productId: productId ?? "" });
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
          quantity: form.quantity,
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
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl">Estoque</h1>
        <Button onClick={() => openMovementDialog()}>
          + Nova movimentação
        </Button>
      </div>

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

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg">Saldo por produto</h2>
        <div className="flex gap-3">
          <Select
            value={categoryFilter || undefined}
            onValueChange={(value) => {
              setBalancePageNum(1);
              setCategoryFilter(value === TODAS_CATEGORIAS ? "" : (value ?? ""));
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-48"
              aria-label="Filtrar saldo por categoria"
            >
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS_CATEGORIAS}>
                Todas as categorias
              </SelectItem>
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
                setBalancePageNum(1);
                setSubcategoryFilter(
                  value === TODAS_SUBCATEGORIAS ? "" : (value ?? ""),
                );
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-48"
                aria-label="Filtrar saldo por subcategoria"
              >
                <SelectValue placeholder="Todas as subcategorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAS_SUBCATEGORIAS}>
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
      </div>

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
                <TableCell>{product.stock}</TableCell>
                <TableCell>{product.minStock}</TableCell>
                <TableCell>
                  <Badge className={statusBadgeClass(status)}>{status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMovementDialog(product.id)}
                  >
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={movementProductFilter || undefined}
          onValueChange={(value) => {
            setMovementPageNum(1);
            setMovementProductFilter(
              value === TODOS_PRODUTOS ? "" : (value ?? ""),
            );
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-48"
            aria-label="Filtrar histórico por produto"
          >
            <SelectValue placeholder="Todos os produtos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS_PRODUTOS}>Todos os produtos</SelectItem>
            {balancePage?.items.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={movementTypeFilter || undefined}
          onValueChange={(value) => {
            setMovementPageNum(1);
            setMovementTypeFilter(value === TODOS_TIPOS ? "" : (value ?? ""));
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-40"
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
            className="w-40"
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
            className="w-40"
            value={movementTo}
            onChange={(e) => {
              setMovementPageNum(1);
              setMovementTo(e.target.value);
            }}
          />
        </div>
      </div>

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
              <Select
                value={form.productId || undefined}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, productId: value ?? "" }))
                }
              >
                <SelectTrigger id="movement-product" className="w-full">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {balancePage?.items.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="movement-quantity">Quantidade</Label>
              <Input
                id="movement-quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, quantity: e.target.value }))
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
      <TableCell>{movement.quantity}</TableCell>
      <TableCell>{movement.user.name}</TableCell>
      <TableCell>
        {new Date(movement.createdAt).toLocaleString("pt-BR")}
      </TableCell>
    </TableRow>
  );
}
