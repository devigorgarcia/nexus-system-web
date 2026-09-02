import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SubcategoriasScreen } from "./subcategorias-screen";

// Gestão de subcategorias (T3.18) — mesma regra de guard das outras telas
// de produto (T3.4): Bronze tem acesso total implícito.
export default async function SubcategoriasPage() {
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

  return <SubcategoriasScreen />;
}
