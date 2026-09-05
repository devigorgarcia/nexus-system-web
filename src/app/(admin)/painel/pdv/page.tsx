import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { getLiveAccess } from "@/lib/live-access";
import { hasModule } from "@/lib/modules";
import { hasPerm } from "@/lib/permissions";
import { PdvScreen } from "./pdv-screen";

// PDV (T4.4) — módulo `vendas` + permissão `acessar:pdv` (Vendedor nasce
// com ela). Destino padrão pós-login quando o usuário tem essa permissão.
export default async function PdvPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const access = (await getLiveAccess()) ?? {
    permissions: session.user.permissions,
    enabledModules: session.user.enabledModules,
  };

  if (
    !access.enabledModules.includes("vendas") ||
    !hasPerm(access.permissions, "acessar:pdv")
  ) {
    const fallback = getDefaultRoute({
      permissions: access.permissions,
      enabledModules: access.enabledModules,
    });
    if (fallback) {
      redirect(fallback);
    }
    return (
      <div className="px-4 py-16 text-center sm:px-6">
        <h1 className="font-heading text-xl">Nenhum módulo liberado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua empresa ainda não tem nenhum módulo habilitado pro seu usuário.
          Fale com o administrador da sua empresa ou da plataforma.
        </p>
      </div>
    );
  }

  const canSelectVendedor = hasPerm(access.permissions, "selecionar:vendedor");

  return (
    <PdvScreen
      currentUserId={session.user.id}
      currentUserName={session.user.name}
      canSelectVendedor={canSelectVendedor}
      canSelectCustomer={hasModule(access.enabledModules, "cadastros")}
    />
  );
}
