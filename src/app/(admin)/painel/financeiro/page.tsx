import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { FinanceiroScreen } from "./financeiro-screen";

// Financeiro (T5.2) — só quem tem `acessar:financeiro` (Admin/Dono ou
// Financeiro, permission-catalog.ts) numa empresa com o módulo `financeiro`
// habilitado (rota /painel-admin, docs/decisions.md 2026-09-03).
export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canAccessFinance =
    session.user.enabledModules.includes("financeiro") &&
    session.user.permissions.includes("acessar:financeiro");

  if (!canAccessFinance) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <FinanceiroScreen />;
}
