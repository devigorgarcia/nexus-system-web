import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { CategoriasScreen } from "./categorias-screen";

// Gestão de categorias de produto (T3.4) — precisa do módulo `produtos`
// habilitado (rota /painel-admin) e da permissão `gerenciar:produtos`.
export default async function CategoriasPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canManageProducts =
    session.user.enabledModules.includes("produtos") &&
    session.user.permissions.includes("gerenciar:produtos");

  if (!canManageProducts) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <CategoriasScreen />;
}
