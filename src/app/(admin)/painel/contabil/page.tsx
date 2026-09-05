import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { ContabilScreen } from "./contabil-screen";

export default async function ContabilPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canAccess =
    session.user.enabledModules.includes("fiscal") &&
    (session.user.permissions.includes("acessar:contabil") ||
      session.user.permissions.includes("acessar:financeiro"));

  if (!canAccess) {
    redirect(
      getDefaultRoute({
        permissions: session.user.permissions,
        enabledModules: session.user.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <ContabilScreen />;
}
