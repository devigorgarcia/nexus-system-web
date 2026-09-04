"use client";

import { createContext, useContext, type ReactNode } from "react";
import { hasModule } from "@/lib/modules";

const EnabledModulesContext = createContext<string[]>([]);

export function EnabledModulesProvider({
  enabledModules,
  children,
}: {
  enabledModules: string[];
  children: ReactNode;
}) {
  return (
    <EnabledModulesContext.Provider value={enabledModules}>
      {children}
    </EnabledModulesContext.Provider>
  );
}

export function useEnabledModules(): string[] {
  return useContext(EnabledModulesContext);
}

export function useHasModule(key: string): boolean {
  return hasModule(useEnabledModules(), key);
}
