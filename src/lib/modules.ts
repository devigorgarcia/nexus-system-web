export const CADASTROS_KEYS = [
  "cadastros",
  "usuarios",
  "clientes",
  "fornecedores",
] as const;

export function hasModule(enabledModules: string[], key: string): boolean {
  if ((CADASTROS_KEYS as readonly string[]).includes(key)) {
    return CADASTROS_KEYS.some((item) => enabledModules.includes(item));
  }
  return enabledModules.includes(key);
}

export type ModuleCatalogItem = {
  key: string;
  label: string;
  includes: string[];
};

export type DisplayModule = ModuleCatalogItem & { aliases: string[] };

// Agrupa Usuários + Clientes + Fornecedores num card só ("Cadastro"), mesmo
// se a API ainda devolver as três chaves antigas como itens separados.
export function groupCadastroCatalog(
  catalog: ModuleCatalogItem[],
): DisplayModule[] {
  const result: DisplayModule[] = [];
  let insertedCadastro = false;

  for (const item of catalog) {
    if ((CADASTROS_KEYS as readonly string[]).includes(item.key)) {
      if (!insertedCadastro) {
        result.push({
          key: "cadastros",
          label: "Cadastro",
          includes: ["Usuários", "Clientes", "Fornecedores"],
          aliases: [...CADASTROS_KEYS],
        });
        insertedCadastro = true;
      }
      continue;
    }
    result.push({ ...item, aliases: [item.key] });
  }

  return result;
}

export function cadastroKeysInCatalog(catalog: ModuleCatalogItem[]): string[] {
  const catalogKeys = new Set(catalog.map((item) => item.key));
  const present = CADASTROS_KEYS.filter((key) => catalogKeys.has(key));
  return present.length > 0 ? present : ["cadastros"];
}
