import { redirect } from "next/navigation";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { getLiveAccess } from "@/lib/live-access";
import { hasModule } from "@/lib/modules";
import { UsuariosScreen } from "./usuarios-screen";

// Gestão de usuários e papéis (T2.5, design handoff §9) — precisa do módulo
// `cadastros` habilitado (rota /painel-admin) e de pelo menos uma das duas
// permissões que essa tela cobre; cada aba interna ainda decide o que
// mostrar com a permissão específica dela.
export default async function UsuariosPage() {
  const access = await getLiveAccess();

  if (!access) {
    redirect("/login");
  }

  if (!hasModule(access.enabledModules, "cadastros")) {
    redirect(
      getDefaultRoute({
        permissions: access.permissions,
        enabledModules: access.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  const canManageUsers = access.permissions.includes("gerenciar:usuarios");
  const canManageRoles = access.permissions.includes("gerenciar:papeis");

  if (!canManageUsers && !canManageRoles) {
    redirect(
      getDefaultRoute({
        permissions: access.permissions,
        enabledModules: access.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return (
    <UsuariosScreen
      canManageUsers={canManageUsers}
      canManageRoles={canManageRoles}
    />
  );
}
