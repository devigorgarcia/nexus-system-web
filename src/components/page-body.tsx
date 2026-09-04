import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageBodyProps = {
  children: ReactNode;
  className?: string;
};

// Área de conteúdo em largura total — sem max-width nem centralizar.
export function PageBody({ children, className }: PageBodyProps) {
  return (
    <div className={cn("w-full min-w-0 px-4 py-5 sm:px-6", className)}>
      {children}
    </div>
  );
}
