"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EnabledModulesProvider } from "@/lib/modules-context";
import { groupNavSections, type NavSection } from "./nav-sections";

type AdminShellProps = {
  navItems: NavSection[];
  user: { name: string; email: string };
  enabledModules: string[];
  children: ReactNode;
};

function useActiveHref(navItems: NavSection[], pathname: string) {
  return [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    ?.href;
}

function Brand({
  href,
  onNavigate,
}: {
  href: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="mb-4 flex items-center gap-2.5 border-b border-sidebar-border px-6 pb-6"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-[15px]">
        P
      </span>
      <span className="font-heading text-[15px]">Nexus</span>
    </Link>
  );
}

function SidebarNav({
  navItems,
  activeHref,
  onNavigate,
}: {
  navItems: NavSection[];
  activeHref?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
      {groupNavSections(navItems).map((group) => (
        <div key={group.label || group.items[0]?.href} className="mt-3 first:mt-0">
          {group.label ? (
            <div className="px-6 pb-1.5 pt-1 text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
              {group.label}
            </div>
          ) : null}
          {group.items.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className="flex items-center gap-2.5 border-l-[3px] py-2 text-sm"
                style={{
                  paddingLeft: group.label ? "1.75rem" : "1.5rem",
                  paddingRight: "1.5rem",
                  borderLeftColor: isActive ? "var(--primary)" : "transparent",
                  backgroundColor: isActive
                    ? "var(--sidebar-accent)"
                    : "transparent",
                  color: isActive
                    ? "var(--sidebar-accent-foreground)"
                    : "var(--sidebar-foreground)",
                }}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarUser({ user }: { user: { name: string; email: string } }) {
  return (
    <div className="border-t border-sidebar-border px-6 py-3.5 text-xs text-sidebar-foreground/70">
      <div className="truncate">{user.name}</div>
      <div className="truncate text-[11px] text-sidebar-foreground/50">
        {user.email}
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-2 text-[11px] font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground"
      >
        Sair
      </button>
    </div>
  );
}

function SidebarChrome({
  navItems,
  user,
  activeHref,
  onNavigate,
}: {
  navItems: NavSection[];
  user: { name: string; email: string };
  activeHref?: string;
  onNavigate?: () => void;
}) {
  const home = navItems[0]?.href ?? "/painel/pdv";
  return (
    <>
      <Brand href={home} onNavigate={onNavigate} />
      <SidebarNav
        navItems={navItems}
        activeHref={activeHref}
        onNavigate={onNavigate}
      />
      <SidebarUser user={user} />
    </>
  );
}

// Sidebar 220px no desktop. Abaixo de `lg` (tablet retrato e celular) o
// menu vira uma barra no topo + gaveta, pra não comer a metade da tela.
export function AdminShell({
  navItems,
  user,
  enabledModules,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeHref = useActiveHref(navItems, pathname);
  const home = navItems[0]?.href ?? "/painel/pdv";
  const activeTitle =
    navItems.find((item) => item.href === activeHref)?.title ?? "Painel";

  return (
    <EnabledModulesProvider enabledModules={enabledModules}>
    <div className="flex h-dvh min-h-0">
      <aside className="hidden w-[220px] flex-shrink-0 flex-col bg-sidebar py-6 text-sidebar-foreground lg:flex">
        <SidebarChrome
          navItems={navItems}
          user={user}
          activeHref={activeHref}
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </Button>
          <Link href={home} className="font-heading text-[15px]">
            Nexus
          </Link>
          <span className="truncate text-sm text-muted-foreground">
            {activeTitle}
          </span>
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-[min(20rem,88vw)] gap-0 bg-sidebar p-0 py-6 text-sidebar-foreground sm:max-w-none"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu do painel</SheetTitle>
            </SheetHeader>
            <SidebarChrome
              navItems={navItems}
              user={user}
              activeHref={activeHref}
              onNavigate={() => setMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
    </EnabledModulesProvider>
  );
}
