"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getDefaultRoute } from "@/app/(admin)/nav-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Recria o layout da tela "Login" do design handoff
// (design_handoff_palacio_das_velas/README.md §1). Submissão real via NextAuth
// contra o AuthModule da API (T2.3) — `authorize()` em src/lib/auth.ts é quem
// de fato valida a credencial, esta tela só repassa e trata o resultado.
export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      usuario: formData.get("usuario"),
      senha: formData.get("senha"),
      redirect: false,
    });

    if (result?.error) {
      setError(true);
      setSubmitting(false);
      return;
    }

    // Mesma tela de login pra empresa e Admin da plataforma (o e-mail já
    // resolve pra um ou outro na API) — só o destino pós-login muda. Não
    // existe mais hub em /painel: o padrão pós-login de empresa é ir direto
    // pro PDV (primeiro item da sidebar); getDefaultRoute cobre o caso raro
    // de a empresa não ter módulo nenhum liberado pra esse usuário.
    const session = await getSession();
    if (session?.user.isPlatformAdmin) {
      router.push("/painel-admin");
      return;
    }
    router.push(
      getDefaultRoute({
        permissions: session?.user.permissions ?? [],
        enabledModules: session?.user.enabledModules ?? [],
      }) ?? "/painel/pdv",
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-center bg-sidebar px-16 text-sidebar-foreground md:flex">
        <span className="font-heading text-4xl italic">Palácio das Velas</span>
        <p className="mt-4 max-w-sm text-sm text-sidebar-foreground/70">
          Painel administrativo — PDV, estoque e financeiro num só lugar.
        </p>
      </div>
      <div className="flex w-full items-center justify-center bg-background px-6 md:w-1/2">
        <form
          className="flex w-80 flex-col gap-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => void handleSubmit(event)}
        >
          <h1 className="mb-2 font-heading text-2xl">Entrar</h1>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="usuario">Usuário</Label>
            <Input id="usuario" name="usuario" autoComplete="username" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              Usuário ou senha inválidos.
            </p>
          )}
          <Button type="submit" className="mt-2" disabled={submitting}>
            Entrar
          </Button>
          <a href="#" className="text-center text-sm text-muted-foreground">
            Esqueci minha senha
          </a>
        </form>
      </div>
    </div>
  );
}
