export type NavSection = {
  href: string;
  title: string;
  description: string;
  // Item de topo na sidebar persistente (design Hi-Fi: PDV, Produtos, Estoque,
  // Promoções, Pedidos, Financeiro, Usuários — 7 itens fixos). Telas mais
  // finas (Categorias/Subcategorias/Importação) ficam de fora da sidebar,
  // acessíveis só por link direto dentro da própria tela de Produtos.
  sidebar?: boolean;
};

// Fonte única da lista de seções do painel — usada pela sidebar persistente
// (admin-shell.tsx) e pelo fallback de acesso negado (getDefaultRoute, abaixo).
// Antes cada uma tinha sua própria cópia da checagem de permissão; centralizar
// aqui evita que as duas navegações fiquem dessincronizadas quando uma
// permissão nova entrar no catálogo (mesmo risco que já exigiu atualizar
// vários e2e-specs no backend).
export function getNavSections({
  permissions,
  enabledModules,
}: {
  permissions: string[];
  // Módulo habilitado pra empresa pelo Admin da plataforma (rota
  // /plataforma) — modelo de negócio é por módulo (docs/decisions.md
  // 2026-09-03), gate independente de permissão, checado de novo no backend
  // por `ModuleGuard` (nunca só escondido aqui).
  enabledModules: string[];
}): NavSection[] {
  const hasVendas = enabledModules.includes("vendas");
  const hasProdutos = enabledModules.includes("produtos");
  const hasEstoque = enabledModules.includes("estoque");
  const hasPromocoes = enabledModules.includes("promocoes");
  const hasFinanceiro = enabledModules.includes("financeiro");
  const hasUsuarios = enabledModules.includes("usuarios");

  const canManageProducts = hasProdutos && permissions.includes("gerenciar:produtos");
  const canManagePromotions =
    hasPromocoes && permissions.includes("gerenciar:promocoes");
  const canManageUsers = hasUsuarios && permissions.includes("gerenciar:usuarios");
  const canManageRoles = hasUsuarios && permissions.includes("gerenciar:papeis");
  const canAccessFinance = hasFinanceiro && permissions.includes("acessar:financeiro");

  // PDV/Pedidos (Fase 4, constitution.md §1.6 — prioridade nº1) sem gate de
  // permissão: qualquer funcionário logado opera as duas telas, Vendedor
  // incluso (nasce sem nenhuma permissão granular). Módulo `vendas` é o
  // único gate delas.
  const sections: (NavSection | false)[] = [
    hasVendas && {
      href: "/painel/pdv",
      title: "PDV",
      description: "Montar carrinho e enviar pedido pra fila de pagamento.",
      sidebar: true,
    },
    hasVendas && {
      href: "/painel/pedidos",
      title: "Pedidos",
      description: "Cobrar pedidos pendentes e conferir o histórico.",
      sidebar: true,
    },
    canManageProducts && {
      href: "/painel/produtos",
      title: "Produtos",
      description: "Cadastro de produtos, preço e estoque.",
      sidebar: true,
    },
    hasEstoque &&
      permissions.includes("gerenciar:produtos") && {
        href: "/painel/produtos/estoque",
        title: "Estoque",
        description: "Saldo por produto e histórico de movimentações.",
        sidebar: true,
      },
    canManagePromotions && {
      href: "/painel/produtos/promocoes",
      title: "Promoções",
      description: "Preço promocional por período ou dia da semana.",
      sidebar: true,
    },
    canAccessFinance && {
      href: "/painel/financeiro",
      title: "Financeiro",
      description: "Caixa, demonstrativo e relatórios de vendas.",
      sidebar: true,
    },
    (canManageUsers || canManageRoles) && {
      href: "/painel/usuarios",
      title: "Usuários",
      description: "Funcionários, papéis e permissões.",
      sidebar: true,
    },
    canManageProducts && {
      href: "/painel/produtos/categorias",
      title: "Categorias",
      description: "Organize os produtos por categoria.",
    },
    canManageProducts && {
      href: "/painel/produtos/subcategorias",
      title: "Subcategorias",
      description: "Refine a organização dentro de cada categoria.",
    },
    canManageProducts && {
      href: "/painel/produtos/importacoes",
      title: "Importação",
      description: "Planilha de fornecedor e fila de revisão.",
    },
  ];

  return sections.filter((section): section is NavSection => Boolean(section));
}

// Não existe mais hub em /painel (removido — o padrão pós-login é ir direto
// pro PDV, e cada tela sem acesso precisa de algum lugar acessível pra
// mandar o usuário). Usado pelo login e por toda tela com guard de
// módulo/permissão como alvo do redirect quando o próprio acesso falha —
// primeiro item da sidebar que esse usuário realmente enxerga, nunca a
// própria tela que acabou de negar acesso (evita loop: o item retornado vem
// da mesma checagem de disponibilidade que gerou o guard). `null` só quando o
// usuário não tem nenhuma seção disponível (empresa sem nenhum módulo pro
// usuário, ou usuário sem nenhuma permissão numa empresa com só módulos
// permissionados) — cabe a quem chama decidir o que fazer nesse caso.
export function getDefaultRoute(params: {
  permissions: string[];
  enabledModules: string[];
}): string | null {
  const sections = getNavSections(params).filter((section) => section.sidebar);
  return sections[0]?.href ?? null;
}
