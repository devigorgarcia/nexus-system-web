import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

// Header de tela: faixa sólida (nunca transparente) ocupando a largura
// inteira da área de conteúdo. A sidebar continua sendo o menu.
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex w-full flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-border bg-card px-4 py-4 sm:px-6 print:hidden",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-heading text-[1.65rem] leading-none tracking-tight sm:text-[1.85rem]">
          <span className="border-b-[3px] border-primary pb-1">{title}</span>
        </h1>
        {description ? (
          <p className="mt-2.5 text-sm leading-snug text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
