import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ImportacoesScreen } from "./importacoes-screen";

// Upload de planilha de fornecedor + fila de revisão (T3.8/T3.9). Mesma
// regra de guard das outras telas de produto: Bronze tem acesso total
// implícito.
export default async function ImportacoesPage() {
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

  return <ImportacoesScreen />;
}
