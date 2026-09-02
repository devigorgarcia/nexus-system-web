import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UsuariosScreen } from "./usuarios-screen";

// Gestão de usuários e papéis (T2.5, design handoff §9). Bronze não usa RBAC
// (usuário único, acesso total implícito, T2.1/T2.4) — a tela nem existe pra
// esse plano. Fora isso, precisa de pelo menos uma das duas permissões que
// essa tela cobre; cada aba interna ainda decide o que mostrar com a
// permissão específica dela.
export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.plan === "BRONZE") {
    redirect("/painel");
  }

  const canManageUsers = session.user.permissions.includes(
    "gerenciar:usuarios",
  );
  const canManageRoles = session.user.permissions.includes(
    "gerenciar:papeis",
  );

  if (!canManageUsers && !canManageRoles) {
    redirect("/painel");
  }

  return (
    <UsuariosScreen
      canManageUsers={canManageUsers}
      canManageRoles={canManageRoles}
    />
  );
}
