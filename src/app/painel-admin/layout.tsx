import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { PlatformShell } from "./platform-shell";

// Protege a rota inteira: sem sessão vai pro login; sessão de empresa
// (isPlatformAdmin: false) vai pro painel dela — mesmo que alguém digite a
// URL direto, nunca alcança o conteúdo (RBAC real é o `PlatformGuard` no
// backend, isto aqui só evita a tela piscar antes do 403 da API).
export default async function PlatformLayout({
  children,
}: LayoutProps<"/painel-admin">) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.isPlatformAdmin) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PlatformShell user={{ name: session.user.name, email: session.user.email }}>
        {children}
      </PlatformShell>
    </div>
  );
}
