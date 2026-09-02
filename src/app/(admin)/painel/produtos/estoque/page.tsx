import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { EstoqueScreen } from "./estoque-screen";

// Tela de estoque e movimentação (T3.7). Mesma regra de guard das outras
// telas de produto (T3.4/T3.5): Bronze tem acesso total implícito.
export default async function EstoquePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canManageProducts =
    session.user.plan === "BRONZE" ||
    session.user.permissions.includes("gerenciar:produtos");

  if (!canManageProducts) {
    redirect("/painel");
  }

  return <EstoqueScreen />;
}
