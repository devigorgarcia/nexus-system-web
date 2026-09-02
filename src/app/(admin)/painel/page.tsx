import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Home do painel pós-login. Antes disto (T1.3) era só um placeholder provando
// a proteção de sessão — home "de verdade" (provavelmente redirect pra /pdv,
// prioridade nº1 do produto, spec.md §7) entra quando a Fase 4 existir.
// Enquanto isso, vira um hub com link pras telas já construídas — sem isso não
// havia nenhuma navegação no painel, cada URL só era alcançável digitando
// direto (achado construindo T3.4/T3.5).
export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);
  const permissions = session?.user.permissions ?? [];
  const isBronze = session?.user.plan === "BRONZE";
  const canManageProducts = isBronze || permissions.includes("gerenciar:produtos");
  const canManagePromotions = isBronze || permissions.includes("gerenciar:promocoes");
  const canManageUsers = permissions.includes("gerenciar:usuarios");
  const canManageRoles = permissions.includes("gerenciar:papeis");

  const sections = [
    canManageProducts && {
      href: "/painel/produtos",
      title: "Produtos",
      description: "Cadastro de produtos, preço e estoque.",
    },
    canManageProducts && {
      href: "/painel/produtos/categorias",
      title: "Categorias",
      description: "Organize os produtos por categoria.",
    },
    canManageProducts && {
      href: "/painel/produtos/estoque",
      title: "Estoque",
      description: "Saldo por produto e histórico de movimentações.",
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
    canManagePromotions && {
      href: "/painel/produtos/promocoes",
      title: "Promoções",
      description: "Preço promocional por período ou dia da semana.",
    },
    (canManageUsers || canManageRoles) &&
      !isBronze && {
        href: "/painel/usuarios",
        title: "Usuários",
        description: "Funcionários, papéis e permissões.",
      },
  ].filter((section): section is Exclude<typeof section, false> => Boolean(section));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-2xl">
        Bem-vindo{session?.user.name ? `, ${session.user.name}` : ""}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Área protegida — você está autenticado.
      </p>

      {sections.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
