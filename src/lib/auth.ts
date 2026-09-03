import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Formato devolvido por POST /auth/login na API (nexus-api,
// src/auth/session-user.ts) — nunca inclui passwordHash. Admin da plataforma
// (rota /painel-admin) vem com companyId nulo e isPlatformAdmin: true.
interface ApiSessionUser {
  id: string;
  name: string;
  email: string;
  companyId: string | null;
  permissions: string[];
  isPlatformAdmin: boolean;
  enabledModules: string[];
}

// Integração real com o AuthModule da API (T2.3). `authorize()` só repassa
// e-mail/senha pro backend e devolve exatamente o que ele resolveu — nunca
// decide sozinho se a credencial é válida (a API é a única fonte de verdade
// de senha/hash).
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        usuario: { label: "Usuário", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.usuario || !credentials?.senha) {
          return null;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.usuario,
              password: credentials.senha,
            }),
          },
        );

        if (!response.ok) {
          // Credencial errada ou usuário inexistente — API já devolve
          // mensagem genérica (spec.md §14), NextAuth só precisa de `null`
          // pra recusar o login.
          return null;
        }

        const sessionUser = (await response.json()) as ApiSessionUser;
        return sessionUser;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8h — spec.md §14
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // `user` só existe na primeira chamada (login) — token persiste entre
    // requisições, então companyId/permissões precisam ser copiados pra ele
    // aqui, não lidos de `user` de novo depois.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.companyId = user.companyId;
        token.permissions = user.permissions;
        token.isPlatformAdmin = user.isPlatformAdmin;
        token.enabledModules = user.enabledModules;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.companyId = token.companyId;
      session.user.permissions = token.permissions;
      // Cookie de sessão emitido antes destes dois campos existirem (usuário
      // já estava logado quando esta feature foi ao ar) não tem
      // `isPlatformAdmin`/`enabledModules` no token — default seguro em vez
      // de derrubar toda sessão pré-existente com `undefined.includes()`
      // (nav-sections.ts). Some sozinho no próximo login (JWT reemitido).
      session.user.isPlatformAdmin = token.isPlatformAdmin ?? false;
      session.user.enabledModules = token.enabledModules ?? [];
      return session;
    },
  },
  // Cookie de sessão: httpOnly + SameSite=Lax por padrão do NextAuth, e Secure
  // automático quando servido via HTTPS (spec.md §14) — não hardcodear aqui,
  // senão quebra em dev local (http://localhost).
};
