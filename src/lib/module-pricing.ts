// Fórmula: salário mínimo × (soma dos pesos dos módulos-mãe ativos) / 100.
// Os módulos-mãe são os mesmos da tela de Clientes (MODULE_CATALOG).
// Pesos iniciais: PDV+caixa 20; Financeiro = pagar 15 + receber 15.

export const DEFAULT_SALARIO_MINIMO = 1621;
export const DEFAULT_PISO_MENSAL = 150;

export type PricingModuleId =
  | "cadastros"
  | "vendas"
  | "produtos"
  | "estoque"
  | "promocoes"
  | "financeiro"
  | "compras"
  | "fiscal"
  | "online";

export type PricingModuleDef = {
  id: PricingModuleId;
  label: string;
  includes: string[];
  defaultWeight: number;
  dependsOn: PricingModuleId[];
  alwaysOn?: boolean;
};

export const PRICING_MODULES: PricingModuleDef[] = [
  {
    id: "cadastros",
    label: "Cadastro",
    includes: ["Usuários", "Clientes", "Fornecedores"],
    defaultWeight: 0,
    dependsOn: [],
    alwaysOn: true,
  },
  {
    id: "vendas",
    label: "PDV / Pedidos",
    includes: ["PDV", "Pedidos", "Caixa"],
    defaultWeight: 20,
    dependsOn: ["cadastros"],
  },
  {
    id: "produtos",
    label: "Produtos",
    includes: ["Produtos", "Categorias", "Subcategorias", "Importação"],
    defaultWeight: 0,
    dependsOn: ["cadastros"],
  },
  {
    id: "estoque",
    label: "Estoque",
    includes: ["Estoque"],
    defaultWeight: 10,
    dependsOn: ["cadastros"],
  },
  {
    id: "promocoes",
    label: "Promoções",
    includes: ["Promoções"],
    defaultWeight: 0,
    dependsOn: ["cadastros"],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    includes: ["Contas a pagar", "Contas a receber", "Maquininha"],
    defaultWeight: 30,
    dependsOn: ["cadastros"],
  },
  {
    id: "compras",
    label: "Compras",
    includes: ["Pedidos de compra", "Recebimento"],
    defaultWeight: 0,
    dependsOn: ["cadastros"],
  },
  {
    id: "fiscal",
    label: "Fiscal e contábil",
    includes: ["Emissão NFC-e (simulada)", "Contábil"],
    defaultWeight: 20,
    dependsOn: ["financeiro"],
  },
  {
    id: "online",
    label: "Venda online",
    includes: ["Loja online"],
    defaultWeight: 10,
    dependsOn: ["vendas", "estoque"],
  },
];

export const DEFAULT_WEIGHTS: Record<PricingModuleId, number> =
  Object.fromEntries(
    PRICING_MODULES.map((module) => [module.id, module.defaultWeight]),
  ) as Record<PricingModuleId, number>;

export function migrateStoredWeights(
  stored: Record<string, number> | undefined,
): Record<PricingModuleId, number> {
  const next = { ...DEFAULT_WEIGHTS };
  if (!stored) return next;

  if (typeof stored.pdv === "number" && stored.vendas === undefined) {
    next.vendas = stored.pdv;
  }
  if (
    stored.financeiro === undefined &&
    (stored.pagar !== undefined ||
      stored.receber !== undefined ||
      stored.relatorios !== undefined)
  ) {
    next.financeiro =
      (stored.pagar ?? 15) + (stored.receber ?? 15) + (stored.relatorios ?? 10);
  }

  for (const module of PRICING_MODULES) {
    if (typeof stored[module.id] === "number") {
      next[module.id] = stored[module.id];
    }
  }
  return next;
}

export function pricingIdsFromCompanyModules(
  enabledModules: string[],
): PricingModuleId[] {
  const active = new Set<PricingModuleId>(["cadastros"]);
  for (const module of PRICING_MODULES) {
    if (module.alwaysOn) continue;
    if (enabledModules.includes(module.id)) active.add(module.id);
  }
  return PRICING_MODULES.map((module) => module.id).filter((id) =>
    active.has(id),
  );
}

export function dependentsOf(moduleId: PricingModuleId): PricingModuleId[] {
  return PRICING_MODULES.filter((module) =>
    module.dependsOn.includes(moduleId),
  ).map((module) => module.id);
}

export function missingDependencies(
  moduleId: PricingModuleId,
  active: PricingModuleId[],
): PricingModuleId[] {
  const def = PRICING_MODULES.find((module) => module.id === moduleId);
  if (!def) return [];
  return def.dependsOn.filter((dep) => !active.includes(dep));
}

export function calculateMonthlyPrice(
  activeModules: PricingModuleId[],
  weights: Record<PricingModuleId, number>,
  salarioMinimo: number,
  piso = 0,
): { percentOfMinWage: number; monthlyPrice: number } {
  const percentOfMinWage = activeModules.reduce(
    (sum, id) => sum + (weights[id] ?? 0),
    0,
  );
  const raw = Math.round((salarioMinimo * percentOfMinWage) / 100);
  const monthlyPrice =
    percentOfMinWage > 0 && piso > 0 ? Math.max(raw, Math.round(piso)) : raw;
  return { percentOfMinWage, monthlyPrice };
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
