"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { SearchableSelect } from "@/components/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, ApiError } from "@/lib/api-client";
import { searchProducts, searchSuppliers } from "@/lib/search-options";
import { useHasModule } from "@/lib/modules-context";
import type { PurchaseListItem } from "./types";

function formatCurrency(value: string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const STATUS_LABEL: Record<PurchaseListItem["status"], string> = {
  PENDENTE: "pendente",
  RECEBIDA: "recebida",
  CANCELADA: "cancelada",
};

interface DraftLine {
  key: string;
  productId: string;
  productName: string;
  quantity: string;
  unitCost: string;
}

const EMPTY_LINE = (): DraftLine => ({
  key: crypto.randomUUID(),
  productId: "",
  productName: "",
  quantity: "1",
  unitCost: "",
});

export function ComprasScreen() {
  const hasEstoque = useHasModule("estoque");
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([EMPTY_LINE()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    const purchaseData = await apiFetch<PurchaseListItem[]>("/purchases");
    setPurchases(purchaseData);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  async function handleCreate() {
    setSaving(true);
    setFormError(null);
    try {
      await apiFetch("/purchases", {
        method: "POST",
        body: JSON.stringify({
          supplierId,
          items: lines
            .filter((line) => line.productId && line.quantity && line.unitCost)
            .map((line) => ({
              productId: line.productId,
              quantity: line.quantity.replace(",", "."),
              unitCost: line.unitCost.replace(",", "."),
            })),
        }),
      });
      setDialogOpen(false);
      await reload();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Erro ao criar a compra.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function receive(id: string) {
    try {
      await apiFetch(`/purchases/${id}/receive`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await reload();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Erro ao receber.");
    }
  }

  async function cancel(id: string) {
    try {
      await apiFetch(`/purchases/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await reload();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Erro ao cancelar.");
    }
  }

  function purchaseTotal(purchase: PurchaseListItem) {
    return purchase.items
      .reduce(
        (sum, item) => sum + Number(item.quantityOrdered) * Number(item.unitCost),
        0,
      )
      .toFixed(2);
  }

  return (
    <div>
      <PageHeader
        title="Compras"
        description={
          hasEstoque
            ? "Pedido de compra, recebimento e entrada no estoque."
            : "Pedido de compra e recebimento."
        }
        actions={
          <Button
            onClick={() => {
              setSupplierId("");
              setSupplierName("");
              setLines([EMPTY_LINE()]);
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            Nova compra
          </Button>
        }
      />
      <PageBody>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && purchases.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Nenhuma compra lançada ainda.
                </TableCell>
              </TableRow>
            )}
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-mono text-xs">
                  {purchase.id.slice(0, 8)}
                </TableCell>
                <TableCell>{purchase.supplier.name}</TableCell>
                <TableCell>{purchase.items.length}</TableCell>
                <TableCell>{formatCurrency(purchaseTotal(purchase))}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      purchase.status === "RECEBIDA"
                        ? "default"
                        : purchase.status === "CANCELADA"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {STATUS_LABEL[purchase.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {purchase.status === "PENDENTE" && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => void receive(purchase.id)}>
                        Receber
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void cancel(purchase.id)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova compra</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Fornecedor</Label>
                <SearchableSelect
                  aria-label="Fornecedor"
                  value={supplierId}
                  valueLabel={supplierName}
                  fetchOptions={searchSuppliers}
                  placeholder="Escolha o fornecedor"
                  onChange={(value, option) => {
                    setSupplierId(value);
                    setSupplierName(option?.label ?? "");
                  }}
                />
              </div>

              {lines.map((line, index) => (
                <div
                  key={line.key}
                  className="grid grid-cols-1 items-end gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_5rem_7rem_auto] sm:rounded-none sm:border-0 sm:p-0"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label className={index === 0 ? undefined : "sm:sr-only"}>
                      Produto
                    </Label>
                    <SearchableSelect
                      aria-label={`Produto ${index + 1}`}
                      value={line.productId}
                      valueLabel={line.productName}
                      fetchOptions={searchProducts}
                      placeholder="Produto"
                      onChange={(productId, option) =>
                        setLines((prev) =>
                          prev.map((row) =>
                            row.key === line.key
                              ? {
                                  ...row,
                                  productId,
                                  productName: option?.label ?? "",
                                }
                              : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className={index === 0 ? undefined : "sm:sr-only"}>
                      Qtd
                    </Label>
                    <Input
                      value={line.quantity}
                      onChange={(event) =>
                        setLines((prev) =>
                          prev.map((row) =>
                            row.key === line.key
                              ? { ...row, quantity: event.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className={index === 0 ? undefined : "sm:sr-only"}>
                      Custo
                    </Label>
                    <MoneyInput
                      value={line.unitCost}
                      onChange={(unitCost) =>
                        setLines((prev) =>
                          prev.map((row) =>
                            row.key === line.key ? { ...row, unitCost } : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="justify-self-end text-destructive sm:justify-self-auto"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((prev) => prev.filter((row) => row.key !== line.key))
                    }
                    aria-label="Remover item"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setLines((prev) => [...prev, EMPTY_LINE()])}
              >
                <Plus className="size-3.5" />
                Item
              </Button>

              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => void handleCreate()}
                disabled={saving || !supplierId}
              >
                Criar pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageBody>
    </div>
  );
}
