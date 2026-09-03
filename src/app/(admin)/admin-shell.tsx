"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import type { NavSection } from "./nav-sections";

type AdminShellProps = {
  navItems: NavSection[];
  user: { name: string; email: string };
  children: ReactNode;
};

// Sidebar 220px fixa — recriando o handoff de design
// (design_handoff_nexus/README.md, seção "Screens / Views" e
// "Design Tokens"). O layout anterior (T1.3) não tinha nenhum shell de
// navegação persistente, só os cards do hub em /painel.
//
// Sem barra superior: conferido contra o próprio protótipo Hi-Fi (e contra o
// print do Figma) — o design não tem nenhuma barra de topo, só sidebar + main
// com o título de cada tela solto no próprio conteúdo. "Sair" não existe no
// design (protótipo client-only, sem sessão de verdade), mas um app real
// precisa da ação — colocado no rodapé da sidebar, perto da identidade do
// usuário, em vez de inventar uma barra que a Hi-Fi não tem.
export function AdminShell({ navItems, user, children }: AdminShellProps) {
  const pathname = usePathname();

  // Item de sidebar cujo href é o prefixo mais específico da rota atual —
  // ordenado por tamanho decrescente pra "/painel/produtos/estoque" casar com
  // "Estoque" em vez do prefixo mais genérico "Produtos".
  const activeItem = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[220px] flex-shrink-0 flex-col bg-sidebar py-6 text-sidebar-foreground">
        <Link
          href={navItems[0]?.href ?? "/painel/pdv"}
          className="mb-4 flex items-center gap-2.5 border-b border-sidebar-border px-6 pb-6"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-[15px]">
            P
          </span>
          <span className="font-heading text-[15px]">Nexus</span>
        </Link>

        <nav className="flex flex-col">
          {navItems.map((item) => {
            const isActive = item.href === activeItem?.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 border-l-[3px] px-6 py-2.5 text-sm"
                style={{
                  borderLeftColor: isActive ? "var(--primary)" : "transparent",
                  backgroundColor: isActive ? "var(--sidebar-accent)" : "transparent",
                  color: isActive
                    ? "var(--sidebar-accent-foreground)"
                    : "var(--sidebar-foreground)",
                }}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="border-t border-sidebar-border px-6 py-3.5 text-xs text-sidebar-foreground/70">
          <div className="truncate">{user.name}</div>
          <div className="truncate text-[11px] text-sidebar-foreground/50">{user.email}</div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2 text-[11px] font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
