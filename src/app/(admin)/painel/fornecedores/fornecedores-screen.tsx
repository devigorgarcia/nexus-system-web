"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, alertApiError, ApiError } from "@/lib/api-client";
import type { SupplierListItem } from "./types";

interface FormState {
  id?: string;
  name: string;
  document: string;
  email: string;
  phone: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  document: "",
  email: "",
  phone: "",
};

export function FornecedoresScreen() {
  const [items, setItems] = useState<SupplierListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    const data = await apiFetch<SupplierListItem[]>("/suppliers");
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  function payload() {
    return {
      name: form.name,
      document: form.document || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
    };
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    try {
      if (form.id) {
        await apiFetch(`/suppliers/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload()),
        });
      } else {
        await apiFetch("/suppliers", {
          method: "POST",
          body: JSON.stringify(payload()),
        });
      }
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

  async function toggleActive(item: SupplierListItem) {
    try {
      if (item.active) {
        await apiFetch(`/suppliers/${item.id}`, { method: "DELETE" });
      } else {
        await apiFetch(`/suppliers/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: item.name,
            document: item.document ?? undefined,
            email: item.email ?? undefined,
            phone: item.phone ?? undefined,
            active: true,
          }),
        });
      }
      await reload();
    } catch (error) {
      alertApiError(error, "Erro ao atualizar.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description="Cadastro usado nas compras e nas contas a pagar."
        actions={
          <Button
            onClick={() => {
              setForm(EMPTY_FORM);
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            Novo fornecedor
          </Button>
        }
      />
      <PageBody>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Nenhum fornecedor cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.document ?? "—"}</TableCell>
                <TableCell>{item.phone ?? item.email ?? "—"}</TableCell>
                <TableCell>
                  <Switch
                    checked={item.active}
                    onCheckedChange={() => void toggleActive(item)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setForm({
                        id: item.id,
                        name: item.name,
                        document: item.document ?? "",
                        email: item.email ?? "",
                        phone: item.phone ?? "",
                      });
                      setFormError(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {form.id ? "Editar fornecedor" : "Novo fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Field
                id="supplier-name"
                label="Nome"
                value={form.name}
                onChange={(name) => setForm((prev) => ({ ...prev, name }))}
              />
              <Field
                id="supplier-document"
                label="CPF ou CNPJ"
                value={form.document}
                onChange={(document) =>
                  setForm((prev) => ({ ...prev, document }))
                }
              />
              <Field
                id="supplier-email"
                label="E-mail"
                value={form.email}
                onChange={(email) => setForm((prev) => ({ ...prev, email }))}
              />
              <Field
                id="supplier-phone"
                label="Telefone"
                value={form.phone}
                onChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
              />
              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => void handleSave()}
                disabled={saving || !form.name}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageBody>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
