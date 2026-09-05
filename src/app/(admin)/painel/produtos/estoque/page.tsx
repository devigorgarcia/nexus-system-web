import { redirect } from "next/navigation";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { getLiveAccess } from "@/lib/live-access";
import { hasModule } from "@/lib/modules";
import { hasAnyPerm, hasPerm } from "@/lib/permissions";
import { EstoqueScreen } from "./estoque-screen";

// Tela de estoque e movimentação (T3.7) — precisa do módulo `estoque`
// habilitado (rota /painel-admin) e da permissão `gerenciar:produtos` (mesma
// permissão de Produto/Categoria, gate de módulo separado no backend
// `stock-movements.controller.ts`).
export default async function EstoquePage() {
  const access = await getLiveAccess();

  if (!access) {
    redirect("/login");
  }

  const canManageProducts =
    hasModule(access.enabledModules, "estoque") &&
    hasAnyPerm(access.permissions, ["gerenciar:estoque", "gerenciar:produtos"]);

  if (!canManageProducts) {
    redirect(
      getDefaultRoute({
        permissions: access.permissions,
        enabledModules: access.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return (
    <EstoqueScreen
      canSeeCost={hasPerm(access.permissions, "ver:custo-produto")}
    />
  );
}
