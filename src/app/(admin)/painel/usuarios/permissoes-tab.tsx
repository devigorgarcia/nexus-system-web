"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageToolbar } from "@/components/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { apiFetch, alertApiError, ApiError } from "@/lib/api-client";
import { hasModule } from "@/lib/modules";
import { useEnabledModules } from "@/lib/modules-context";
import type { PermissionCatalogItem, RoleListItem } from "./types";

function groupCatalog(catalog: PermissionCatalogItem[]) {
  const groups: { key: string; label: string; items: PermissionCatalogItem[] }[] =
    [];
  for (const permission of catalog) {
    const key = permission.module ?? "outros";
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(permission);
    } else {
      groups.push({
        key,
        label: permission.moduleLabel ?? key,
        items: [permission],
      });
    }
  }
  return groups;
}

export function PermissoesTab() {
  const enabledModules = useEnabledModules();
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const visibleCatalog = useMemo(
    () =>
      catalog.filter((permission) =>
        permission.module
          ? hasModule(enabledModules, permission.module)
          : false,
      ),
    [catalog, enabledModules],
  );
  const catalogGroups = useMemo(
    () => groupCatalog(visibleCatalog),
    [visibleCatalog],
  );

  async function reload() {
    const [rolesData, catalogData] = await Promise.all([
      apiFetch<RoleListItem[]>("/roles"),
      apiFetch<PermissionCatalogItem[]>("/roles/permissions"),
    ]);
    setRoles(rolesData);
    setCatalog(catalogData);
  }

  useEffect(() => {
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
    const visible = new Set(visibleCatalog.map((item) => item.code));
    const currentCodes = role.rolePermissions.map((rp) => rp.permission.code);
    const hidden = currentCodes.filter((item) => !visible.has(item));
    const currentVisible = currentCodes.filter((item) => visible.has(item));
    const nextVisible = currentVisible.includes(code)
      ? currentVisible.filter((item) => item !== code)
      : [...currentVisible, code];
    const nextCodes = [...nextVisible, ...hidden];

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
              <div className="flex flex-col gap-4">
                {catalogGroups.map((group) => (
                  <div key={group.key}>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((permission) => (
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
                          {permission.label ?? permission.code}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
