import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ProdutosScreen } from "./produtos-screen";

// Tela de cadastro de produtos (T3.5). Mesma regra de guard de
// `/painel/produtos/categorias` (T3.4): Bronze tem acesso total implícito
// (usuário único, T2.1/T2.4); Prata+ precisa de `gerenciar:produtos`.
export default async function ProdutosPage() {
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

  return <ProdutosScreen />;
}
