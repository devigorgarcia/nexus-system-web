import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { PedidosScreen } from "./pedidos-screen";

// Fila de Pedidos (T4.7) — sem gate de permissão: qualquer funcionário
// logado opera a fila, Vendedor incluso (mesmo padrão do PDV, T4.4). Escopo
// fino (Vendedor só vê a própria venda) é aplicado no backend (T4.8's IDOR,
// spec.md §14), nunca no frontend. Só o módulo `vendas` (rota /painel-admin)
// precisa estar habilitado — mesma chave do PDV, uma entidade `Sale` só.
export default async function PedidosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.enabledModules.includes("vendas")) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <PedidosScreen />;
}
