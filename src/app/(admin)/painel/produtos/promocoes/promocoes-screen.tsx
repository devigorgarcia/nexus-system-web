"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { ProductListItem, ProductsPage } from "../types";
import type { PromotionItem, PromotionsPage, PromotionStatus } from "./types";

const PAGE_SIZE = 10;
const TODOS_PRODUTOS = "__todos__";
const TODOS_STATUS = "__todos_status__";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function statusBadgeClass(status: PromotionStatus) {
  if (status === "vigente") return "bg-success text-success-foreground";
  if (status === "futura") return "bg-warning text-warning-foreground";
  return "bg-secondary text-secondary-foreground";
}

interface PromotionFormState {
  productId: string;
  promoPrice: string;
  vigencyType: "PERIODO" | "DIA_SEMANA";
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
}

const EMPTY_FORM: PromotionFormState = {
  productId: "",
  promoPrice: "",
  vigencyType: "PERIODO",
  startDate: "",
  endDate: "",
  daysOfWeek: [],
};

export function PromocoesScreen() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [promotionsPage, setPromotionsPage] = useState<PromotionsPage | null>(
    null,
  );
  const [pageNum, setPageNum] = useState(1);
  const [productFilter, setProductFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PromotionFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const params = new URLSearchParams({
      page: String(pageNum),
      pageSize: String(PAGE_SIZE),
    });
    if (productFilter) params.set("productId", productFilter);
    if (statusFilter) params.set("status", statusFilter);

    const [promotionsData, productsData] = await Promise.all([
      apiFetch<PromotionsPage>(`/promotions?${params.toString()}`),
      apiFetch<ProductsPage>("/products?active=true&pageSize=100"),
    ]);
    setPromotionsPage(promotionsData);
    setProducts(productsData.items);
  }

  useEffect(() => {
    // Carga/recarga a cada mudança de página ou filtro — sem lib de
    // data-fetching no projeto, padrão aceito de "buscar ao montar/mudar"
    // (react.dev/learn/you-might-not-need-an-effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, productFilter, statusFilter]);

  function openCreateDialog() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function toggleWeekday(day: number) {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        productId: form.productId,
        promoPrice: form.promoPrice,
        vigencyType: form.vigencyType,
      };
      if (form.vigencyType === "PERIODO") {
        body.startDate = new Date(form.startDate).toISOString();
        body.endDate = new Date(form.endDate).toISOString();
      } else {
        body.daysOfWeek = form.daysOfWeek;
      }

      await apiFetch("/promotions", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setDialogOpen(false);
      await reload();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Erro ao salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleEnd(promotion: PromotionItem) {
    if (!confirm(`Encerrar a promoção de "${promotion.product.name}" agora?`)) {
      return;
    }
    try {
      await apiFetch(`/promotions/${promotion.id}`, { method: "DELETE" });
      await reload();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Erro ao encerrar.");
    }
  }

  const totalPages = promotionsPage
    ? Math.max(1, Math.ceil(promotionsPage.total / promotionsPage.pageSize))
    : 1;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl">Promoções</h1>
        <Button onClick={openCreateDialog}>+ Nova promoção</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={productFilter || undefined}
          onValueChange={(value) => {
            setPageNum(1);
            setProductFilter(value === TODOS_PRODUTOS ? "" : (value ?? ""));
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-56"
            aria-label="Filtrar por produto"
          >
            <SelectValue placeholder="Todos os produtos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS_PRODUTOS}>Todos os produtos</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter || undefined}
          onValueChange={(value) => {
            setPageNum(1);
            setStatusFilter(value === TODOS_STATUS ? "" : (value ?? ""));
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-40"
            aria-label="Filtrar por status"
          >
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS_STATUS}>Todos os status</SelectItem>
            <SelectItem value="vigente">Vigente</SelectItem>
            <SelectItem value="futura">Futura</SelectItem>
            <SelectItem value="encerrada">Encerrada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Preço promocional</TableHead>
            <TableHead>Vigência</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promotionsPage?.items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Nenhuma promoção encontrada.
              </TableCell>
            </TableRow>
          )}
          {promotionsPage?.items.map((promotion) => (
            <TableRow key={promotion.id}>
              <TableCell>{promotion.product.name}</TableCell>
              <TableCell>R$ {promotion.promoPrice}</TableCell>
              <TableCell>
                {promotion.vigencyType === "PERIODO"
                  ? `${new Date(promotion.startDate!).toLocaleDateString("pt-BR")} – ${new Date(promotion.endDate!).toLocaleDateString("pt-BR")}`
                  : promotion.daysOfWeek
                      .slice()
                      .sort()
                      .map((d) => WEEKDAY_LABELS[d])
                      .join(", ")}
              </TableCell>
              <TableCell>
                <Badge className={statusBadgeClass(promotion.status)}>
                  {promotion.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {promotion.status !== "encerrada" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleEnd(promotion)}
                  >
                    Encerrar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {promotionsPage?.page ?? 1} de {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={pageNum <= 1}
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={pageNum >= totalPages}
            onClick={() => setPageNum((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova promoção</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promotion-product">Produto</Label>
              <Select
                value={form.productId || undefined}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, productId: value ?? "" }))
                }
              >
                <SelectTrigger id="promotion-product" className="w-full">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promotion-price">Preço promocional (R$)</Label>
              <Input
                id="promotion-price"
                inputMode="decimal"
                placeholder="0.00"
                value={form.promoPrice}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, promoPrice: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promotion-vigency-type">Tipo de vigência</Label>
              <Select
                value={form.vigencyType}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    vigencyType:
                      (value as "PERIODO" | "DIA_SEMANA") ?? "PERIODO",
                  }))
                }
              >
                <SelectTrigger id="promotion-vigency-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERIODO">Período</SelectItem>
                  <SelectItem value="DIA_SEMANA">Dia da semana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.vigencyType === "PERIODO" ? (
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="promotion-start">Início</Label>
                  <Input
                    id="promotion-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="promotion-end">Fim</Label>
                  <Input
                    id="promotion-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_LABELS.map((label, day) => (
                    <label
                      key={day}
                      className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm"
                    >
                      <Checkbox
                        checked={form.daysOfWeek.includes(day)}
                        onCheckedChange={() => toggleWeekday(day)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => void handleSave()}
              disabled={
                saving ||
                !form.productId ||
                !form.promoPrice ||
                (form.vigencyType === "PERIODO"
                  ? !form.startDate || !form.endDate
                  : form.daysOfWeek.length === 0)
              }
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
