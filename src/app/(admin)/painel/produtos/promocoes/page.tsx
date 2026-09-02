import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PromocoesScreen } from "./promocoes-screen";

// Gestão de promoções (T3.11) — só Admin/Dono (PRD §4.12): diferente das
// outras telas de produto, aqui a permissão é `gerenciar:promocoes`, não
// `gerenciar:produtos` (Estoquista não gerencia promoção). Bronze continua
// com acesso total implícito (T2.1/T2.4).
export default async function PromocoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canManagePromotions =
    session.user.plan === "BRONZE" ||
    session.user.permissions.includes("gerenciar:promocoes");

  if (!canManagePromotions) {
    redirect("/painel");
  }

  return <PromocoesScreen />;
}
