import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { CategoriasScreen } from "./categorias-screen";

// Gestão de categorias de produto (T3.4). Ao contrário de Usuários/Papéis
// (T2.5, bloqueada pra Bronze — não faz sentido RBAC com um usuário só),
// Produto/Categoria existe em qualquer plano: loja Bronze também cadastra
// produto. Bronze tem acesso total implícito (T2.1/T2.4) — só Prata+ precisa
// da permissão `gerenciar:produtos` de verdade.
export default async function CategoriasPage() {
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

  return <CategoriasScreen />;
}
