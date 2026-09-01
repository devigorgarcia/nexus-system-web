import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Placeholder de bootstrap (T1.2) — integração real com o AuthModule da API
// (login, guarda de sessão com companyId/permissões) é T2.3, docs/begin/tasks.md.
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        usuario: { label: "Usuário", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize() {
        // TODO(T2.3): chamar POST /auth/login na API e mapear a sessão
        // (companyId, permissões) — nunca autenticar aqui sem a API.
        return null;
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
  // Cookie de sessão: httpOnly + SameSite=Lax por padrão do NextAuth, e Secure
  // automático quando servido via HTTPS (spec.md §14) — não hardcodear aqui,
  // senão quebra em dev local (http://localhost).
};
