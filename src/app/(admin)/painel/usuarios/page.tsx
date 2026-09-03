import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { UsuariosScreen } from "./usuarios-screen";

// Gestão de usuários e papéis (T2.5, design handoff §9) — precisa do módulo
// `usuarios` habilitado (rota /plataforma) e de pelo menos uma das duas
// permissões que essa tela cobre; cada aba interna ainda decide o que
// mostrar com a permissão específica dela.
export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.enabledModules.includes("usuarios")) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  const canManageUsers = session.user.permissions.includes(
    "gerenciar:usuarios",
  );
  const canManageRoles = session.user.permissions.includes(
    "gerenciar:papeis",
  );

  if (!canManageUsers && !canManageRoles) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
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
