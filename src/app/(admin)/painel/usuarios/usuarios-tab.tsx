"use client";

import { useEffect, useState } from "react";
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
import type { RoleListItem, UserListItem } from "./types";

interface UserFormState {
  id?: string;
  name: string;
  email: string;
  password: string;
  roleIds: string[];
}

const EMPTY_FORM: UserFormState = {
  name: "",
  email: "",
  password: "",
  roleIds: [],
};

export function UsuariosTab() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    const [usersData, rolesData] = await Promise.all([
      apiFetch<UserListItem[]>("/users"),
      apiFetch<RoleListItem[]>("/roles"),
    ]);
    setUsers(usersData);
    setRoles(rolesData);
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

  function openEditDialog(user: UserListItem) {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      roleIds: user.userRoles.map((ur) => ur.role.id),
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function toggleRole(roleId: string) {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    try {
      if (form.id) {
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          roleIds: form.roleIds,
        };
        if (form.password) {
          body.password = form.password;
        }
        await apiFetch(`/users/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/users", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            roleIds: form.roleIds,
          }),
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

  async function toggleActive(user: UserListItem) {
    try {
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !user.active }),
      });
      await reload();
    } catch (error) {
      // Ex.: tentar desativar a própria conta — API rejeita com 400 e
      // mensagem clara, exibida aqui mesmo sem dialog nenhum.
      alert(error instanceof ApiError ? error.message : "Erro ao atualizar.");
    }
  }

  async function handleDelete(user: UserListItem) {
    if (!confirm(`Apagar o funcionário "${user.name}"?`)) {
      return;
    }
    try {
      await apiFetch(`/users/${user.id}`, { method: "DELETE" });
      await reload();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Erro ao apagar.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreateDialog}>+ Novo usuário</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!loading && users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhum funcionário cadastrado ainda.
              </TableCell>
            </TableRow>
          )}
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.userRoles.length === 0
                  ? "—"
                  : user.userRoles.map((ur) => ur.role.name).join(", ")}
              </TableCell>
              <TableCell>
                <Switch
                  checked={user.active}
                  onCheckedChange={() => void toggleActive(user)}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(user)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(user)}
                >
                  Apagar
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
              {form.id ? "Editar funcionário" : "Novo usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-name">Nome</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-email">E-mail</Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-password">
                {form.id ? "Nova senha (opcional)" : "Senha"}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Perfil</Label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm"
                  >
                    <Checkbox
                      checked={form.roleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    {role.name}
                  </label>
                ))}
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
              onClick={() => void handleSave()}
              disabled={saving || !form.name || !form.email || (!form.id && !form.password)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
