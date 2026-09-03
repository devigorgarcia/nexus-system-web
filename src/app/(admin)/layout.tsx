import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "./admin-shell";
import { getNavSections } from "./nav-sections";

// Protege todo o grupo (admin): sem sessão, redireciona pro login (T1.3).
// RBAC/escopo por permissão dentro do painel é backend (Fase 2) — isto aqui é
// só a checagem de "está logado", nunca controle de acesso real (spec.md §5).
// A sidebar/topbar (design_handoff_palacio_das_velas) filtra os itens de nav
// pela mesma lógica de permissão do hub (getNavSections), não é controle de
// acesso — só esconde da UI o que a rota de destino já bloquearia sozinha.
export default async function AdminLayout({
  children,
}: LayoutProps<"/">) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const navItems = getNavSections({
    permissions: session.user.permissions,
    plan: session.user.plan,
  }).filter((section) => section.sidebar);

  return (
    <div className="min-h-screen bg-background">
      <AdminShell
        navItems={navItems}
        user={{ name: session.user.name, email: session.user.email }}
      >
        {children}
      </AdminShell>
    </div>
  );
}
