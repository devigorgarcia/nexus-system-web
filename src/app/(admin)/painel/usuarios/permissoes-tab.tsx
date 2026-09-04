"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageToolbar } from "@/components/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { apiFetch, alertApiError, ApiError } from "@/lib/api-client";
import type { PermissionCatalogItem, RoleListItem } from "./types";

// Aba "Permissões" (design handoff §9): criar papel novo (nome, validação de
// duplicidade) e uma matriz por papel com toggle de cada permissão do
// catálogo. O handoff mostra "TELAS"/"CAPACIDADES" como duas categorias
// visuais — com só 3 permissões existindo até agora (T2.1), uma lista única
// já é clara; separar em categorias fica pra quando o catálogo crescer o
// suficiente pra isso valer a pena (T3.x em diante).
export function PermissoesTab() {
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    const [rolesData, catalogData] = await Promise.all([
      apiFetch<RoleListItem[]>("/roles"),
      apiFetch<PermissionCatalogItem[]>("/roles/permissions"),
    ]);
    setRoles(rolesData);
    setCatalog(catalogData);
  }

  useEffect(() => {
    // Carga inicial da tela — sem lib de data-fetching no projeto, é o
    // padrão aceito de "buscar ao montar" (react.dev/learn/you-might-not-need-an-effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  async function handleCreateRole() {
    setCreating(true);
    setCreateError(null);
    try {
      await apiFetch("/roles", {
        method: "POST",
        body: JSON.stringify({ name: newRoleName, permissionCodes: [] }),
      });
      setNewRoleName("");
      await reload();
    } catch (error) {
      setCreateError(
        error instanceof ApiError ? error.message : "Erro ao criar papel.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function togglePermission(role: RoleListItem, code: string) {
    const currentCodes = role.rolePermissions.map((rp) => rp.permission.code);
    const nextCodes = currentCodes.includes(code)
      ? currentCodes.filter((c) => c !== code)
      : [...currentCodes, code];

    await apiFetch(`/roles/${role.id}`, {
      method: "PATCH",
      body: JSON.stringify({ permissionCodes: nextCodes }),
    });
    await reload();
  }

  async function handleDeleteRole(role: RoleListItem) {
    if (!confirm(`Apagar o papel "${role.name}"?`)) {
      return;
    }
    try {
      await apiFetch(`/roles/${role.id}`, { method: "DELETE" });
      await reload();
    } catch (error) {
      alertApiError(error, "Erro ao apagar.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageToolbar className="items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="new-role-name" className="text-sm font-medium">
            Novo papel
          </label>
          <Input
            id="new-role-name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Nome do papel"
          />
        </div>
        <Button
          onClick={() => void handleCreateRole()}
          disabled={creating || !newRoleName}
        >
          <Plus className="size-3.5" />
          Criar perfil
        </Button>
      </PageToolbar>
      {createError && (
        <p className="-mt-4 text-sm text-destructive" role="alert">
          {createError}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {roles.map((role) => {
          const grantedCodes = new Set(
            role.rolePermissions.map((rp) => rp.permission.code),
          );

          return (
            <Card key={role.id} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{role.name}</span>
                  {role.isDefault && <Badge variant="secondary">Padrão</Badge>}
                </div>
                {!role.isDefault && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleDeleteRole(role)}
                  >
                    <Trash2 className="size-3.5" />
                    Apagar
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {catalog.map((permission) => (
                  <label
                    key={permission.code}
                    className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm"
                    title={permission.description}
                  >
                    <Checkbox
                      checked={grantedCodes.has(permission.code)}
                      onCheckedChange={() =>
                        void togglePermission(role, permission.code)
                      }
                    />
                    {permission.code}
                  </label>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
