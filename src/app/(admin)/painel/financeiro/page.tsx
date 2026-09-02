import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { FinanceiroScreen } from "./financeiro-screen";

// Financeiro (T5.2) — só quem tem `acessar:financeiro` (Admin/Dono ou
// Financeiro, permission-catalog.ts); Bronze continua com acesso total
// implícito (T2.1/T2.4), mesmo padrão das outras telas de gestão.
export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canAccessFinance =
    session.user.plan === "BRONZE" ||
    session.user.permissions.includes("acessar:financeiro");

  if (!canAccessFinance) {
    redirect("/painel");
  }

  return <FinanceiroScreen />;
}
