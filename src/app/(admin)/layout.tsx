import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Protege todo o grupo (admin): sem sessão, redireciona pro login (T1.3).
// RBAC/escopo por permissão dentro do painel é backend (Fase 2) — isto aqui é
// só a checagem de "está logado", nunca controle de acesso real (spec.md §5).
export default async function AdminLayout({
  children,
}: LayoutProps<"/">) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
