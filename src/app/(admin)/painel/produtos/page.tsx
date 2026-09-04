import { redirect } from "next/navigation";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { getLiveAccess } from "@/lib/live-access";
import { ProdutosScreen } from "./produtos-screen";

// Tela de cadastro de produtos (T3.5) — precisa do módulo `produtos`
// habilitado (rota /painel-admin) e da permissão `gerenciar:produtos`.
export default async function ProdutosPage() {
  const access = await getLiveAccess();

  if (!access) {
    redirect("/login");
  }

  const canManageProducts =
    access.enabledModules.includes("produtos") &&
    access.permissions.includes("gerenciar:produtos");

  if (!canManageProducts) {
    redirect(
      getDefaultRoute({
        permissions: access.permissions,
        enabledModules: access.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <ProdutosScreen />;
}
