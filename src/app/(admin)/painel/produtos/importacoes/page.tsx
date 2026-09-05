import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { ImportacoesScreen } from "./importacoes-screen";

// Upload de planilha de fornecedor + fila de revisão (T3.8/T3.9) — precisa
// do módulo `produtos` habilitado (rota /painel-admin) e da permissão
// `gerenciar:produtos`.
export default async function ImportacoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canManageProducts =
    session.user.enabledModules.includes("produtos") &&
    (session.user.permissions.includes("gerenciar:importacoes") ||
      session.user.permissions.includes("gerenciar:produtos"));

  if (!canManageProducts) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <ImportacoesScreen />;
}
