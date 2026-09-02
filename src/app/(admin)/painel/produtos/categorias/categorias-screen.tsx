"use client";

import { useEffect, useState } from "react";
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
import { apiFetch, ApiError } from "@/lib/api-client";
import type { CategoryListItem } from "./types";

interface CategoryFormState {
  id?: string;
  name: string;
}

const EMPTY_FORM: CategoryFormState = { name: "" };

// Gestão de categorias de produto (T3.4, docs/decisions.md 2026-08-28: "CRUD
// próprio", sem mockup dedicado no design handoff — Categoria só aparece
// embutida na tela de Produtos por lá). Conjunto pequeno, não paginado
// (spec.md §13.7) — lista tudo (inclusive inativada) pra poder reativar.
export function CategoriasScreen() {
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    const data = await apiFetch<CategoryListItem[]>("/categories");
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    // Carga inicial da tela — sem lib de data-fetching no projeto, é o
    // padrão aceito de "buscar ao montar" (react.dev/learn/you-might-not-need-an-effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  function openCreateDialog() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(category: CategoryListItem) {
    setForm({ id: category.id, name: category.name });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    try {
      if (form.id) {
        await apiFetch(`/categories/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: form.name }),
        });
      } else {
        await apiFetch("/categories", {
          method: "POST",
          body: JSON.stringify({ name: form.name }),
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

  // Switch alterna entre "inativar" (DELETE — soft delete na API, T3.2) e
  // "reativar" (PATCH active: true), nunca um hard delete pela UI.
  async function toggleActive(category: CategoryListItem) {
    try {
      if (category.active) {
        await apiFetch(`/categories/${category.id}`, { method: "DELETE" });
      } else {
        await apiFetch(`/categories/${category.id}`, {
          method: "PATCH",
          body: JSON.stringify({ active: true }),
        });
      }
      await reload();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Erro ao atualizar.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl">Categorias</h1>
        <Button onClick={openCreateDialog}>+ Nova categoria</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!loading && categories.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                Nenhuma categoria cadastrada ainda.
              </TableCell>
            </TableRow>
          )}
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.name}</TableCell>
              <TableCell>
                <Switch
                  checked={category.active}
                  onCheckedChange={() => void toggleActive(category)}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(category)}
                >
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
              {form.id ? "Editar categoria" : "Nova categoria"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-name">Nome</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
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
              onClick={() => void handleSave()}
              disabled={saving || !form.name}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
