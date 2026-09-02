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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { CategoryListItem } from "../categorias/types";
import type { SubcategoryListItem } from "./types";

interface SubcategoryFormState {
  id?: string;
  name: string;
}

const EMPTY_FORM: SubcategoryFormState = { name: "" };

// Gestão de subcategorias (T3.18, PRD P23) — sempre dependente de uma
// categoria escolhida primeiro (mesmo padrão de dependência do design
// handoff pro cadastro de produto: "Subcategoria (chips, depends on
// selected category)").
export function SubcategoriasScreen() {
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategories, setSubcategories] = useState<SubcategoryListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SubcategoryFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reloadCategories() {
    const data = await apiFetch<CategoryListItem[]>("/categories?active=true");
    setCategories(data);
    if (!categoryId && data.length > 0) {
      setCategoryId(data[0].id);
    }
  }

  async function reloadSubcategories() {
    if (!categoryId) {
      setSubcategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await apiFetch<SubcategoryListItem[]>(
      `/subcategories?categoryId=${categoryId}`,
    );
    setSubcategories(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reloadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reloadSubcategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  function openCreateDialog() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(subcategory: SubcategoryListItem) {
    setForm({ id: subcategory.id, name: subcategory.name });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    try {
      if (form.id) {
        await apiFetch(`/subcategories/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: form.name }),
        });
      } else {
        await apiFetch("/subcategories", {
          method: "POST",
          body: JSON.stringify({ categoryId, name: form.name }),
        });
      }
      setDialogOpen(false);
      await reloadSubcategories();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Erro ao salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(subcategory: SubcategoryListItem) {
    try {
      if (subcategory.active) {
        await apiFetch(`/subcategories/${subcategory.id}`, {
          method: "DELETE",
        });
      } else {
        await apiFetch(`/subcategories/${subcategory.id}`, {
          method: "PATCH",
          body: JSON.stringify({ active: true }),
        });
      }
      await reloadSubcategories();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Erro ao atualizar.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl">Subcategorias</h1>
        <Button onClick={openCreateDialog} disabled={!categoryId}>
          + Nova subcategoria
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-1.5">
        <Label htmlFor="subcategory-category">Categoria</Label>
        <Select
          value={categoryId || undefined}
          onValueChange={(value) => setCategoryId(value ?? "")}
        >
          <SelectTrigger id="subcategory-category" className="w-64">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Cadastre uma categoria antes de criar subcategorias.
          </p>
        )}
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
          {!loading && subcategories.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                Nenhuma subcategoria cadastrada nesta categoria ainda.
              </TableCell>
            </TableRow>
          )}
          {subcategories.map((subcategory) => (
            <TableRow key={subcategory.id}>
              <TableCell>{subcategory.name}</TableCell>
              <TableCell>
                <Switch
                  checked={subcategory.active}
                  onCheckedChange={() => void toggleActive(subcategory)}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(subcategory)}
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
              {form.id ? "Editar subcategoria" : "Nova subcategoria"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subcategory-name">Nome</Label>
              <Input
                id="subcategory-name"
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
