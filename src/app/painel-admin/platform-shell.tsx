"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";

type PlatformShellProps = {
  user: { name: string; email: string };
  children: ReactNode;
};

const PLATFORM_NAV = [
  { href: "/painel-admin", label: "Clientes" },
  { href: "/painel-admin/simulacao", label: "Simulação" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/painel-admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Shell da rota exclusiva do Admin da plataforma. Menu curto (clientes +
// simulação de mensalidade) — não é a sidebar de módulos da empresa.
export function PlatformShell({ user, children }: PlatformShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-sidebar px-4 py-3.5 text-sidebar-foreground sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-[15px]">
            P
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-[15px]">Nexus</span>
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

      <nav className="flex gap-1 border-b border-border bg-card px-4 sm:px-6">
        {PLATFORM_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="border-b-2 px-3 py-2.5 text-sm"
              style={{
                borderBottomColor: active ? "var(--primary)" : "transparent",
                color: active ? "var(--foreground)" : "var(--muted-foreground)",
                fontWeight: active ? 600 : 500,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
