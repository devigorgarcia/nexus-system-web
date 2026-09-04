import { redirect } from "next/navigation";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { getLiveAccess } from "@/lib/live-access";
import { MaquininhaScreen } from "./maquininha-screen";

export default async function MaquininhaPage() {
  const access = await getLiveAccess();

  if (!access) {
    redirect("/login");
  }

  const canAccess =
    access.enabledModules.includes("financeiro") &&
    access.permissions.includes("acessar:financeiro");

  if (!canAccess) {
    redirect(
      getDefaultRoute({
        permissions: access.permissions,
        enabledModules: access.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <MaquininhaScreen />;
}
