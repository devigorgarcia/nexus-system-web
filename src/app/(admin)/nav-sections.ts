import { hasModule } from "@/lib/modules";
import { hasAnyPerm, hasPerm } from "@/lib/permissions";

export type NavSection = {
  href: string;
  title: string;
  description: string;
  // Item de topo na sidebar persistente. Cada tela do módulo habilitado
  // entra no menu, agrupada pelo `group`.
  sidebar?: boolean;
  // Rótulo estático da área (Vendas, Produtos, Financeiro, Cadastros) —
  // a sidebar agrupa itens com o mesmo `group`. Sem accordion.
  group?: string;
};

export type NavGroup = {
  label: string;
  items: NavSection[];
};

export function groupNavSections(items: NavSection[]): NavGroup[] {
  const groups: NavGroup[] = [];
  for (const item of items) {
    const label = item.group ?? "";
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }
  return groups;
}

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
  // /painel-admin) — modelo de negócio é por módulo (docs/decisions.md
  // 2026-09-03), gate independente de permissão, checado de novo no backend
  // por `ModuleGuard` (nunca só escondido aqui).
  enabledModules: string[];
}): NavSection[] {
  const hasVendas = enabledModules.includes("vendas");
  const hasProdutos = enabledModules.includes("produtos");
  const hasEstoque = enabledModules.includes("estoque");
  const hasPromocoes = enabledModules.includes("promocoes");
  const hasFinanceiro = enabledModules.includes("financeiro");
  const hasCadastros = hasModule(enabledModules, "cadastros");
  const hasCompras = enabledModules.includes("compras");
  const hasFiscal = enabledModules.includes("fiscal");
  const hasOnline = enabledModules.includes("online");

  const canManageProducts =
    hasProdutos && hasPerm(permissions, "gerenciar:produtos");
  const canManageCategories =
    hasProdutos &&
    hasAnyPerm(permissions, ["gerenciar:categorias", "gerenciar:produtos"]);
  const canManageSubcategories =
    hasProdutos &&
    hasAnyPerm(permissions, ["gerenciar:subcategorias", "gerenciar:produtos"]);
  const canManageImports =
    hasProdutos &&
    hasAnyPerm(permissions, ["gerenciar:importacoes", "gerenciar:produtos"]);
  const canManageStock =
    hasEstoque &&
    hasAnyPerm(permissions, ["gerenciar:estoque", "gerenciar:produtos"]);
  const canManagePromotions =
    hasPromocoes && hasPerm(permissions, "gerenciar:promocoes");
  const canManageUsers =
    hasCadastros && hasPerm(permissions, "gerenciar:usuarios");
  const canManageRoles = hasCadastros && hasPerm(permissions, "gerenciar:papeis");
  const canAccessCaixa = hasVendas && hasPerm(permissions, "acessar:caixa");
  const canAccessPayables =
    hasFinanceiro && hasPerm(permissions, "acessar:contas-pagar");
  const canAccessReceivables =
    hasFinanceiro && hasPerm(permissions, "acessar:contas-receber");
  const canAccessCardMachine =
    hasFinanceiro && hasPerm(permissions, "acessar:maquininha");
  const canAccessFiscal = hasFiscal && hasPerm(permissions, "acessar:fiscal");
  const canAccessContabil =
    hasFiscal && hasPerm(permissions, "acessar:contabil");

  const sections: (NavSection | false)[] = [
    hasVendas &&
      hasPerm(permissions, "acessar:pdv") && {
        href: "/painel/pdv",
        title: "PDV",
        description: "Montar carrinho e enviar pedido pra fila de pagamento.",
        sidebar: true,
        group: "Vendas",
      },
    hasVendas &&
      hasPerm(permissions, "acessar:pedidos") && {
        href: "/painel/pedidos",
        title: "Pedidos",
        description: "Cobrar pedidos pendentes e conferir o histórico.",
        sidebar: true,
        group: "Vendas",
      },
    canAccessCaixa && {
      href: "/painel/financeiro",
      title: "Caixa",
      description: "Abertura, fechamento e movimento do caixa do dia.",
      sidebar: true,
      group: "Vendas",
    },
    hasOnline && {
      href: "/painel/venda-online",
      title: "Venda online",
      description: "Loja online e catálogo publicado.",
      sidebar: true,
      group: "Vendas",
    },
    canManageProducts && {
      href: "/painel/produtos",
      title: "Produtos",
      description: hasEstoque
        ? "Cadastro de produtos, preço e estoque."
        : "Cadastro de produtos e preço.",
      sidebar: true,
      group: "Produtos",
    },
    canManageCategories && {
      href: "/painel/produtos/categorias",
      title: "Categorias",
      description: "Organize os produtos por categoria.",
      sidebar: true,
      group: "Produtos",
    },
    canManageSubcategories && {
      href: "/painel/produtos/subcategorias",
      title: "Subcategorias",
      description: "Refine a organização dentro de cada categoria.",
      sidebar: true,
      group: "Produtos",
    },
    canManageImports && {
      href: "/painel/produtos/importacoes",
      title: "Importação",
      description: "Planilha de fornecedor e fila de revisão.",
      sidebar: true,
      group: "Produtos",
    },
    canManageStock && {
      href: "/painel/produtos/estoque",
      title: "Estoque",
      description: "Saldo por produto e histórico de movimentações.",
      sidebar: true,
      group: "Produtos",
    },
    canManagePromotions && {
      href: "/painel/produtos/promocoes",
      title: "Promoções",
      description: "Preço promocional por período ou dia da semana.",
      sidebar: true,
      group: "Produtos",
    },
    hasCompras &&
      hasPerm(permissions, "gerenciar:compras") && {
        href: "/painel/compras",
        title: "Compras",
        description: "Pedidos de compra e recebimento de mercadoria.",
        sidebar: true,
        group: "Compras",
      },
    canAccessPayables && {
      href: "/painel/contas-a-pagar",
      title: "Contas a pagar",
      description: "Notas de fornecedor e parcelas.",
      sidebar: true,
      group: "Financeiro",
    },
    canAccessReceivables && {
      href: "/painel/contas-a-receber",
      title: "Contas a receber",
      description: "Recebimentos gerados pelas vendas pagas.",
      sidebar: true,
      group: "Financeiro",
    },
    canAccessCardMachine && {
      href: "/painel/maquininha",
      title: "Maquininha",
      description: "Taxas da operadora e o que cai na conta.",
      sidebar: true,
      group: "Financeiro",
    },
    canAccessFiscal && {
      href: "/painel/fiscal",
      title: "Fiscal",
      description: "Configuração da loja e NFC-e simulada.",
      sidebar: true,
      group: "Fiscal",
    },
    canAccessContabil && {
      href: "/painel/contabil",
      title: "Contábil",
      description: "DRE, contas a pagar e a receber do período.",
      sidebar: true,
      group: "Fiscal",
    },
    (canManageUsers || canManageRoles) && {
      href: "/painel/usuarios",
      title: "Usuários",
      description: "Funcionários, papéis e permissões.",
      sidebar: true,
      group: "Cadastros",
    },
    hasCadastros &&
      hasPerm(permissions, "gerenciar:clientes") && {
        href: "/painel/clientes",
        title: "Clientes",
        description: "Cadastro de clientes da loja.",
        sidebar: true,
        group: "Cadastros",
      },
    hasCadastros &&
      hasPerm(permissions, "gerenciar:fornecedores") && {
        href: "/painel/fornecedores",
        title: "Fornecedores",
        description: "Cadastro de fornecedores.",
        sidebar: true,
        group: "Cadastros",
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
