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
import { getNavSections } from "../nav-sections";

// Home do painel pós-login. Antes disto (T1.3) era só um placeholder provando
// a proteção de sessão — home "de verdade" (provavelmente redirect pra /pdv,
// prioridade nº1 do produto, spec.md §7) entra quando a Fase 4 existir.
// Enquanto isso, vira um hub com link pras telas já construídas — sem isso não
// havia nenhuma navegação no painel, cada URL só era alcançável digitando
// direto (achado construindo T3.4/T3.5).
export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);
  const sections = getNavSections({
    permissions: session?.user.permissions ?? [],
    plan: session?.user.plan ?? "",
  });

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
