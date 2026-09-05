// Espelha o `select`/`ROLE_SELECT` da API (nexus-api/src/users,
// src/roles) — T2.5.
export interface UserListItem {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  userRoles: { role: { id: string; name: string } }[];
}

export interface RoleListItem {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  rolePermissions: { permission: { code: string; description: string } }[];
}

export interface PermissionCatalogItem {
  code: string;
  description: string;
  module?: string;
  moduleLabel?: string;
  label?: string;
}
