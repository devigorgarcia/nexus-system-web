import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { ContasAPagarScreen } from "./contas-a-pagar-screen";

export default async function ContasAPagarPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canAccessFinance =
    session.user.enabledModules.includes("financeiro") &&
    (session.user.permissions.includes("acessar:contas-pagar") ||
      session.user.permissions.includes("acessar:financeiro"));

  if (!canAccessFinance) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <ContasAPagarScreen />;
}
