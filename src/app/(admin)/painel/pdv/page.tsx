import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PdvScreen } from "./pdv-screen";

// PDV (T4.4) — prioridade nº1 do produto (constitution.md §1.6). Sem gate de
// permissão: qualquer funcionário logado opera o PDV, Vendedor incluso (nasce
// sem nenhuma permissão granular, permission-catalog.ts).
export default async function PdvPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const canSelectVendedor =
    session.user.plan === "BRONZE" ||
    session.user.permissions.includes("selecionar:vendedor");

  return (
    <PdvScreen
      currentUserId={session.user.id}
      currentUserName={session.user.name}
      canSelectVendedor={canSelectVendedor}
    />
  );
}
