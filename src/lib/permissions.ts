const PARENT_IMPLIES: Record<string, readonly string[]> = {
  "acessar:financeiro": [
    "acessar:caixa",
    "acessar:contas-pagar",
    "acessar:contas-receber",
    "acessar:maquininha",
    "acessar:fiscal",
    "acessar:contabil",
  ],
};

export function hasPerm(
  permissions: readonly string[] | undefined,
  code: string,
): boolean {
  if (!permissions?.length) return false;
  if (permissions.includes(code)) return true;
  for (const [parent, children] of Object.entries(PARENT_IMPLIES)) {
    if (permissions.includes(parent) && children.includes(code)) {
      return true;
    }
  }
  return false;
}

export function hasAnyPerm(
  permissions: readonly string[] | undefined,
  codes: readonly string[],
): boolean {
  return codes.some((code) => hasPerm(permissions, code));
}
