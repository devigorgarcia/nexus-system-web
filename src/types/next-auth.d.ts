import "next-auth";
import "next-auth/jwt";

// Sessão carrega companyId/plan/permissões resolvidas no login (T2.3, spec.md
// §5) — módulo aumentado pra tipar o que authOptions (src/lib/auth.ts)
// realmente guarda no JWT/sessão, além do name/email padrão do NextAuth.
declare module "next-auth" {
  interface User {
    companyId: string;
    plan: string;
    permissions: string[];
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      companyId: string;
      plan: string;
      permissions: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    companyId: string;
    plan: string;
    permissions: string[];
  }
}
