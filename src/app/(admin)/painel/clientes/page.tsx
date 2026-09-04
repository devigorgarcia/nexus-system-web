import { redirect } from "next/navigation";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { getLiveAccess } from "@/lib/live-access";
import { hasModule } from "@/lib/modules";
import { ClientesScreen } from "./clientes-screen";

export default async function ClientesPage() {
  const access = await getLiveAccess();

  if (!access) {
    redirect("/login");
  }

  const canManage =
    hasModule(access.enabledModules, "cadastros") &&
    access.permissions.includes("gerenciar:clientes");

  if (!canManage) {
    redirect(
      getDefaultRoute({
        permissions: access.permissions,
        enabledModules: access.enabledModules,
      }) ?? "/painel/pdv",
    );
  }

  return <ClientesScreen />;
}
