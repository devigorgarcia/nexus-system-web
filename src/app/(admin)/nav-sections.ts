export type NavSection = {
  href: string;
  title: string;
  description: string;
  // Item de topo na sidebar persistente (design Hi-Fi: PDV, Produtos, Estoque,
  // Promoções, Pedidos, Financeiro, Usuários — 7 itens fixos). Telas mais
  // finas (Categorias/Subcategorias/Importação) ficam de fora da sidebar pra
  // não fugir do design, mas continuam acessíveis pelo hub (/painel).
  sidebar?: boolean;
};

// Fonte única da lista de seções do painel — usada pela sidebar persistente
// (admin-shell.tsx) e pelo hub de cards (/painel). Antes cada uma tinha sua
// própria cópia da checagem de permissão; centralizar aqui evita que as duas
// navegações fiquem dessincronizadas quando uma permissão nova entrar no
// catálogo (mesmo risco que já exigiu atualizar vários e2e-specs no backend).
export function getNavSections({
  permissions,
  plan,
}: {
  permissions: string[];
  plan: string;
}): NavSection[] {
  const isBronze = plan === "BRONZE";
  const canManageProducts = isBronze || permissions.includes("gerenciar:produtos");
  const canManagePromotions = isBronze || permissions.includes("gerenciar:promocoes");
  const canManageUsers = permissions.includes("gerenciar:usuarios");
  const canManageRoles = permissions.includes("gerenciar:papeis");
  const canAccessFinance = isBronze || permissions.includes("acessar:financeiro");

  // PDV/Pedidos (Fase 4, constitution.md §1.6 — prioridade nº1) sem gate de
  // permissão: qualquer funcionário logado opera as duas telas, Vendedor
  // incluso (nasce sem nenhuma permissão granular).
  const sections: (NavSection | false)[] = [
    {
      href: "/painel/pdv",
      title: "PDV",
      description: "Montar carrinho e enviar pedido pra fila de pagamento.",
      sidebar: true,
    },
    {
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
    canManageProducts && {
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
    (canManageUsers || canManageRoles) &&
      !isBronze && {
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
