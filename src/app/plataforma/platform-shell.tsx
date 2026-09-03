"use client";

import { signOut } from "next-auth/react";
import type { ReactNode } from "react";

type PlatformShellProps = {
  user: { name: string; email: string };
  children: ReactNode;
};

// Shell mínimo pra rota exclusiva do Admin da plataforma — sem sidebar de
// módulos (não existe "módulo" pra ele navegar, só a gestão de empresas
// assinantes, spec.md §3), diferente de AdminShell (admin-shell.tsx). Barra
// de topo escura reaproveita os mesmos tokens da sidebar do painel de
// empresa, pra deixar claro visualmente que isto é uma área separada.
export function PlatformShell({ user, children }: PlatformShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between bg-sidebar px-6 py-3.5 text-sidebar-foreground">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-[15px]">
            P
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-[15px]">Palácio das Velas</span>
            <span className="text-[11px] text-sidebar-foreground/60">
              Admin da plataforma
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <div className="truncate">{user.name}</div>
            <div className="truncate text-[11px] text-sidebar-foreground/50">
              {user.email}
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[11px] font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
