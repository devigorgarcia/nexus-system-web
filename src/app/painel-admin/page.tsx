import { CompaniesPanel } from "./companies-panel";

export default function PlatformCompaniesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="font-heading text-2xl">Clientes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Escolha um cliente pelo nome ou código e habilite os módulos que ele
        contratou. Cadastro de cliente novo continua pela CLI de onboarding.
      </p>

      <div className="mt-6">
        <CompaniesPanel />
      </div>
    </div>
  );
}
