import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { SubcategoriasScreen } from "./subcategorias-screen";

// Gestão de subcategorias (T3.18) — precisa do módulo `produtos` habilitado
// (rota /painel-admin) e da permissão `gerenciar:produtos`.
export default async function SubcategoriasPage() {
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

  return <SubcategoriasScreen />;
}
