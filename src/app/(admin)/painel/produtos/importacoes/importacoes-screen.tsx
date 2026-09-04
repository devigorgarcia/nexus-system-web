"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, X } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { PageToolbar } from "@/components/page-toolbar";
import { QuickCreateDialog } from "@/components/quick-create-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, apiUpload, ApiError } from "@/lib/api-client";
import { searchCategories } from "@/lib/search-options";
import type { CategoryListItem } from "../categorias/types";
import { useHasModule } from "@/lib/modules-context";
import type { ImportSummary, PendingImportItem, PendingImportsPage } from "./types";

const PAGE_SIZE = 10;
const TODOS_TIPOS = "__todos_tipos__";

interface ReviewFormState {
  name: string;
  salePrice: string;
  categoryId: string;
  categoryName: string;
}

const EMPTY_REVIEW_FORM: ReviewFormState = {
  name: "",
  salePrice: "",
  categoryId: "",
  categoryName: "",
};

export function ImportacoesScreen() {
  const hasEstoque = useHasModule("estoque");
  const [supplierName, setSupplierName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<ImportSummary | null>(null);

  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [pendingPage, setPendingPage] = useState<PendingImportsPage | null>(
    null,
  );
  const [pageNum, setPageNum] = useState(1);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");

  const [reviewItem, setReviewItem] = useState<PendingImportItem | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(
    EMPTY_REVIEW_FORM,
  );
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);

  async function reloadPending() {
    const params = new URLSearchParams({
      page: String(pageNum),
      pageSize: String(PAGE_SIZE),
    });
    if (supplierFilter) params.set("supplierName", supplierFilter);
    if (kindFilter) params.set("kind", kindFilter);

    const pendingData = await apiFetch<PendingImportsPage>(
      `/product-imports/pending?${params.toString()}`,
    );
    setPendingPage(pendingData);
  }

  useEffect(() => {
    // Carga/recarga a cada mudança de página ou filtro — sem lib de
    // data-fetching no projeto, padrão aceito de "buscar ao montar/mudar"
    // (react.dev/learn/you-might-not-need-an-effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reloadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, supplierFilter, kindFilter]);

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !supplierName) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.set("supplierName", supplierName);
      formData.set("file", file);
      const summary = await apiUpload<ImportSummary>(
        "/product-imports/upload",
        formData,
      );
      setLastSummary(summary);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPageNum(1);
      await reloadPending();
    } catch (error) {
      setUploadError(
        error instanceof ApiError ? error.message : "Erro ao importar.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateCategory(name: string) {
    const created = await apiFetch<CategoryListItem>("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setReviewForm((prev) => ({
      ...prev,
      categoryId: created.id,
      categoryName: created.name,
    }));
  }

  function openReview(item: PendingImportItem) {
    setReviewItem(item);
    setReviewForm({
      ...EMPTY_REVIEW_FORM,
      name: item.kind === "PRODUTO_NOVO" ? "" : item.existingProduct?.name ?? "",
    });
    setReviewError(null);
  }

  async function handleConfirm() {
    if (!reviewItem) return;
    setReviewSaving(true);
    setReviewError(null);
    try {
      if (reviewItem.kind === "PRODUTO_NOVO") {
        await apiFetch(
          `/product-imports/pending/${reviewItem.id}/confirm-new-product`,
          {
            method: "POST",
            body: JSON.stringify({
              name: reviewForm.name,
              salePrice: reviewForm.salePrice,
              categoryId: reviewForm.categoryId || undefined,
            }),
          },
        );
      } else {
        await apiFetch(
          `/product-imports/pending/${reviewItem.id}/confirm-cost-change`,
          { method: "POST" },
        );
      }
      setReviewItem(null);
      await reloadPending();
    } catch (error) {
      setReviewError(
        error instanceof ApiError ? error.message : "Erro ao confirmar.",
      );
    } finally {
      setReviewSaving(false);
    }
  }

  async function handleReject(item: PendingImportItem) {
    if (!confirm(`Rejeitar "${item.supplierRawName}"?`)) return;
    try {
      await apiFetch(`/product-imports/pending/${item.id}/reject`, {
        method: "POST",
      });
      if (reviewItem?.id === item.id) setReviewItem(null);
      await reloadPending();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Erro ao rejeitar.");
    }
  }

  const totalPages = pendingPage
    ? Math.max(1, Math.ceil(pendingPage.total / pendingPage.pageSize))
    : 1;

  return (
    <div>
      <PageHeader
        title="Importação"
        description="Planilha de fornecedor e fila de revisão."
      />

      <PageBody>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Importar planilha</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => void handleUpload(e)}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier-name">Fornecedor</Label>
              <Input
                id="supplier-name"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full sm:w-56"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="import-file">Arquivo (CSV)</Label>
              <input
                id="import-file"
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="text-sm"
              />
            </div>
            <Button type="submit" disabled={uploading || !supplierName}>
              {uploading ? "Importando…" : "Importar"}
            </Button>
          </form>

          {uploadError && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {uploadError}
            </p>
          )}
          {lastSummary && !uploadError && (
            <p className="mt-3 text-sm text-muted-foreground">
              {lastSummary.totalRows} linha(s) lida(s)
              {hasEstoque
                ? ` — ${lastSummary.stockUpdated} atualizaram estoque automaticamente`
                : ""}
              , {lastSummary.pendingCreated} foram pra fila de revisão.
            </p>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-3 font-heading text-lg">Fila de revisão</h2>
      <PageToolbar>
          <Input
            placeholder="Filtrar por fornecedor…"
            value={supplierFilter}
            onChange={(e) => {
              setPageNum(1);
              setSupplierFilter(e.target.value);
            }}
            className="w-full sm:w-56"
          />
          <Select
            value={kindFilter || undefined}
            onValueChange={(value) => {
              setPageNum(1);
              setKindFilter(value === TODOS_TIPOS ? "" : (value ?? ""));
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-full sm:w-48"
              aria-label="Filtrar por tipo de pendência"
            >
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS_TIPOS}>Todos os tipos</SelectItem>
              <SelectItem value="PRODUTO_NOVO">Produto novo</SelectItem>
              <SelectItem value="CUSTO_ALTERADO">Custo alterado</SelectItem>
            </SelectContent>
          </Select>
      </PageToolbar>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingPage?.items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Nenhum item pendente.
              </TableCell>
            </TableRow>
          )}
          {pendingPage?.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.supplierName}</TableCell>
              <TableCell>
                {item.kind === "CUSTO_ALTERADO"
                  ? item.existingProduct?.name
                  : item.supplierRawName}
              </TableCell>
              <TableCell>
                <Badge variant={item.kind === "PRODUTO_NOVO" ? "default" : "secondary"}>
                  {item.kind === "PRODUTO_NOVO" ? "Produto novo" : "Custo alterado"}
                </Badge>
              </TableCell>
              <TableCell>
                R$ {item.cost}
                {item.kind === "CUSTO_ALTERADO" && item.existingProduct && (
                  <span className="text-muted-foreground">
                    {" "}
                    (era R$ {item.existingProduct.costPrice})
                  </span>
                )}
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openReview(item)}
                  >
                    <Eye className="size-3.5" />
                    Revisar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleReject(item)}
                  >
                    <X className="size-3.5" />
                    Rejeitar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {pendingPage?.page ?? 1} de {totalPages}
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

      <Dialog
        open={reviewItem !== null}
        onOpenChange={(open) => !open && setReviewItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewItem?.kind === "PRODUTO_NOVO"
                ? "Confirmar produto novo"
                : "Confirmar mudança de custo"}
            </DialogTitle>
          </DialogHeader>

          {reviewItem?.kind === "PRODUTO_NOVO" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Nome do fornecedor: {reviewItem.supplierRawName} · Custo: R${" "}
                {reviewItem.cost} · Quantidade: {reviewItem.quantity}
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="review-name">Nome de venda</Label>
                <Input
                  id="review-name"
                  value={reviewForm.name}
                  onChange={(e) =>
                    setReviewForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="review-sale-price">Preço de venda</Label>
                <MoneyInput
                  id="review-sale-price"
                  value={reviewForm.salePrice}
                  onChange={(salePrice) =>
                    setReviewForm((prev) => ({ ...prev, salePrice }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="review-category">Categoria</Label>
                <SearchableSelect
                  id="review-category"
                  value={reviewForm.categoryId}
                  valueLabel={reviewForm.categoryName}
                  fetchOptions={searchCategories}
                  placeholder="Sem categoria"
                  emptyOption={{ value: "", label: "Sem categoria" }}
                  createLabel="Criar categoria"
                  onCreate={() => setCreateCategoryOpen(true)}
                  onChange={(value, option) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      categoryId: value,
                      categoryName: value ? (option?.label ?? "") : "",
                    }))
                  }
                />
              </div>
            </div>
          ) : (
            reviewItem && (
              <p className="text-sm">
                Produto <strong>{reviewItem.existingProduct?.name}</strong>: custo
                muda de R$ {reviewItem.existingProduct?.costPrice} pra R${" "}
                {reviewItem.cost}.
              </p>
            )
          )}

          {reviewError && (
            <p className="text-sm text-destructive" role="alert">
              {reviewError}
            </p>
          )}

          <DialogFooter>
            <Button
              onClick={() => void handleConfirm()}
              disabled={
                reviewSaving ||
                (reviewItem?.kind === "PRODUTO_NOVO" &&
                  (!reviewForm.name || !reviewForm.salePrice))
              }
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <QuickCreateDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        title="Nova categoria"
        placeholder="Ex.: Velas aromáticas"
        onSubmit={handleCreateCategory}
      />
      </PageBody>
    </div>
  );
}
