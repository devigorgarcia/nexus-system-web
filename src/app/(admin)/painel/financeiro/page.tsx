import { redirect } from "next/navigation";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { getLiveAccess } from "@/lib/live-access";
import { hasPerm } from "@/lib/permissions";
import { FinanceiroScreen } from "./financeiro-screen";

// Caixa (abertura/fechamento) agora vive no módulo `vendas` — é operação
// do dia de venda, não de contas a pagar/receber. A permissão continua
// `acessar:financeiro` (papel Financeiro / Admin).
export default async function FinanceiroPage() {
  const access = await getLiveAccess();

  if (!access) {
    redirect("/login");
  }

  const canAccessCaixa =
    access.enabledModules.includes("vendas") &&
    hasPerm(access.permissions, "acessar:caixa");

  if (!canAccessCaixa) {
    redirect(
      getDefaultRoute({
        permissions: access.permissions,
        enabledModules: access.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return (
    <FinanceiroScreen
      canManageAllRegisters={hasPerm(access.permissions, "gerenciar:caixas")}
    />
  );
}
