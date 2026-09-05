import { redirect } from "next/navigation";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { getLiveAccess } from "@/lib/live-access";
import { hasPerm } from "@/lib/permissions";
import { PedidosScreen } from "./pedidos-screen";

// Fila de Pedidos (T4.7) — módulo `vendas` + permissão `acessar:pedidos`.
// Escopo fino (Vendedor só vê a própria venda) continua no backend.
export default async function PedidosPage() {
  const access = await getLiveAccess();

  if (!access) {
    redirect("/login");
  }

  if (
    !access.enabledModules.includes("vendas") ||
    !hasPerm(access.permissions, "acessar:pedidos")
  ) {
    redirect(
      getDefaultRoute({
        permissions: access.permissions,
        enabledModules: access.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <PedidosScreen />;
}
