import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { ProdutosScreen } from "./produtos-screen";

// Tela de cadastro de produtos (T3.5) — precisa do módulo `produtos`
// habilitado (rota /plataforma) e da permissão `gerenciar:produtos`.
export default async function ProdutosPage() {
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

  return <ProdutosScreen />;
}
