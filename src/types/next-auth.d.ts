import "next-auth";
import "next-auth/jwt";

// Sessão carrega companyId/permissões resolvidas no login (T2.3, spec.md
// §5) — módulo aumentado pra tipar o que authOptions (src/lib/auth.ts)
// realmente guarda no JWT/sessão, além do name/email padrão do NextAuth.
// Admin da plataforma (rota /painel-admin) é o único usuário com companyId
// nulo — `isPlatformAdmin` distingue esse caso. Modelo de negócio é por
// módulo habilitado (`enabledModules`, docs/decisions.md 2026-09-03), não
// por plano — não existe mais campo `plan`.
declare module "next-auth" {
  interface User {
    companyId: string | null;
    permissions: string[];
    isPlatformAdmin: boolean;
    enabledModules: string[];
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      companyId: string | null;
      permissions: string[];
      isPlatformAdmin: boolean;
      enabledModules: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    companyId: string | null;
    permissions: string[];
    isPlatformAdmin: boolean;
    enabledModules: string[];
  }
}
