"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
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
import { apiFetch, alertApiError, ApiError } from "@/lib/api-client";
import type { AccountPayable, PayablesPage } from "./types";

function formatCurrency(value: string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const EMPTY_FORM = {
  supplierName: "",
  description: "",
  totalAmount: "",
  installmentCount: "1",
  firstDueDate: "",
};

export function ContasAPagarScreen() {
  const [page, setPage] = useState<PayablesPage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const data = await apiFetch<PayablesPage>("/accounts-payable?page=1&pageSize=50");
    setPage(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  async function handleCreate() {
    setSaving(true);
    setFormError(null);
    try {
      await apiFetch("/accounts-payable", {
        method: "POST",
        body: JSON.stringify({
          supplierName: form.supplierName,
          description: form.description,
          totalAmount: form.totalAmount.replace(",", "."),
          installmentCount: Number(form.installmentCount),
          firstDueDate: form.firstDueDate,
        }),
      });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      await reload();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Erro ao lançar a nota.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function settle(installmentId: string) {
    try {
      await apiFetch(`/accounts-payable/installments/${installmentId}/settle`, {
        method: "POST",
      });
      await reload();
    } catch (error) {
      alertApiError(error, "Erro ao dar baixa.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Contas a pagar"
        description="Notas de fornecedor e parcelas a vencer."
        actions={
          <Button
            onClick={() => {
              setForm(EMPTY_FORM);
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            Nova nota
          </Button>
        }
      />
      <PageBody>
        <div className="flex flex-col gap-4">
          {(page?.items ?? []).map((note) => (
            <PayableNote
              key={note.id}
              note={note}
              onSettle={(id) => void settle(id)}
            />
          ))}
          {page && page.items.length === 0 && (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhuma nota lançada ainda.
            </p>
          )}
        </div>
      </PageBody>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova nota</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Input
                id="supplier"
                value={form.supplierName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, supplierName: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="total">Valor</Label>
                <MoneyInput
                  id="total"
                  value={form.totalAmount}
                  onChange={(totalAmount) =>
                    setForm((prev) => ({ ...prev, totalAmount }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="count">Parcelas</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={60}
                  value={form.installmentCount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      installmentCount: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="due">1º vencimento</Label>
                <Input
                  id="due"
                  type="date"
                  value={form.firstDueDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      firstDueDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => void handleCreate()}
              disabled={
                saving ||
                !form.supplierName ||
                !form.description ||
                !form.totalAmount ||
                !form.firstDueDate
              }
            >
              {saving ? "Salvando…" : "Lançar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PayableNote({
  note,
  onSettle,
}: {
  note: AccountPayable;
  onSettle: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <div className="font-medium">{note.supplierName}</div>
          <p className="text-sm text-muted-foreground">{note.description}</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold">{formatCurrency(note.totalAmount)}</div>
          <div className="text-muted-foreground">
            {note.installments.length} parcela(s)
          </div>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {note.installments.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.number}</TableCell>
              <TableCell>
                {new Date(row.dueDate).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell>{formatCurrency(row.amount)}</TableCell>
              <TableCell>
                <Badge
                  variant={row.status === "PAGO" ? "secondary" : "outline"}
                >
                  {row.status === "PAGO" ? "Paga" : "Pendente"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {row.status === "PENDENTE" ? (
                  <Button size="sm" onClick={() => onSettle(row.id)}>
                    Dar baixa
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {row.paidAt
                      ? new Date(row.paidAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
