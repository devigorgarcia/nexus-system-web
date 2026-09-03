import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { authOptions } from "@/lib/auth";
import { PdvScreen } from "./pdv-screen";

// PDV (T4.4) — prioridade nº1 do produto (constitution.md §1.6), também é o
// destino padrão pós-login (login/page.tsx). Sem gate de permissão: qualquer
// funcionário logado opera o PDV, Vendedor incluso (nasce sem nenhuma
// permissão granular, permission-catalog.ts). Só o módulo `vendas` (rota
// /painel-admin) precisa estar habilitado.
export default async function PdvPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.enabledModules.includes("vendas")) {
    // getDefaultRoute nunca aponta de volta pro PDV aqui (a lista de seções
    // é calculada com o mesmo enabledModules que reprovou este guard, então
    // exclui o PDV) — sem risco de loop. `null` só no caso raro de a empresa
    // não ter módulo nenhum liberado pra este usuário: sem outro lugar pra
    // mandar, mostra uma tela mínima em vez de redirecionar pra si mesmo.
    const fallback = getDefaultRoute({
      permissions: session.user.permissions,
      enabledModules: session.user.enabledModules,
    });
    if (fallback) {
      redirect(fallback);
    }
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="font-heading text-xl">Nenhum módulo liberado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua empresa ainda não tem nenhum módulo habilitado pro seu usuário.
          Fale com o administrador da sua empresa ou da plataforma.
        </p>
      </div>
    );
  }

  const canSelectVendedor = session.user.permissions.includes(
    "selecionar:vendedor",
  );

  return (
    <PdvScreen
      currentUserId={session.user.id}
      currentUserName={session.user.name}
      canSelectVendedor={canSelectVendedor}
    />
  );
}
