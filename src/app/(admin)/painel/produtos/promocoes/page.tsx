import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { PromocoesScreen } from "./promocoes-screen";

// Gestão de promoções (T3.11) — só Admin/Dono (PRD §4.12): diferente das
// outras telas de produto, aqui a permissão é `gerenciar:promocoes`, não
// `gerenciar:produtos` (Estoquista não gerencia promoção). Precisa do módulo
// `promocoes` habilitado (rota /painel-admin).
export default async function PromocoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canManagePromotions =
    session.user.enabledModules.includes("promocoes") &&
    session.user.permissions.includes("gerenciar:promocoes");

  if (!canManagePromotions) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <PromocoesScreen />;
}
