import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { FiscalScreen } from "./fiscal-screen";

export default async function FiscalPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canAccess =
    session.user.enabledModules.includes("fiscal") &&
    (session.user.permissions.includes("acessar:fiscal") ||
      session.user.permissions.includes("acessar:financeiro"));

  if (!canAccess) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <FiscalScreen />;
}
