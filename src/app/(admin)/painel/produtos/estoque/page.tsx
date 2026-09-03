import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { EstoqueScreen } from "./estoque-screen";

// Tela de estoque e movimentação (T3.7) — precisa do módulo `estoque`
// habilitado (rota /plataforma) e da permissão `gerenciar:produtos` (mesma
// permissão de Produto/Categoria, gate de módulo separado no backend
// `stock-movements.controller.ts`).
export default async function EstoquePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canManageProducts =
    session.user.enabledModules.includes("estoque") &&
    session.user.permissions.includes("gerenciar:produtos");

  if (!canManageProducts) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <EstoqueScreen />;
}
