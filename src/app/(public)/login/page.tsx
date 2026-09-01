import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Placeholder de bootstrap (T1.2) — recria o layout da tela "Login" do design
// handoff (design_handoff_palacio_das_velas/README.md §1). Submissão real
// (NextAuth signIn contra o AuthModule da API) entra em T2.3.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-center bg-sidebar px-16 text-sidebar-foreground md:flex">
        <span className="font-heading text-4xl italic">Palácio das Velas</span>
        <p className="mt-4 max-w-sm text-sm text-sidebar-foreground/70">
          Painel administrativo — PDV, estoque e financeiro num só lugar.
        </p>
      </div>
      <div className="flex w-full items-center justify-center bg-background px-6 md:w-1/2">
        <form className="flex w-80 flex-col gap-4">
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
          <Button type="submit" className="mt-2">
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
