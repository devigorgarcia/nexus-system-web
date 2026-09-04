import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageToolbarProps = {
  children: ReactNode;
  className?: string;
};

// Faixa de filtros/ações no mesmo card branco da tela de Produtos.
export function PageToolbar({ children, className }: PageToolbarProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col items-stretch gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center [&>*]:min-w-0 [&>*]:max-sm:w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}
