import { CompaniesPanel } from "./companies-panel";

export default function PlatformCompaniesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="font-heading text-2xl">Empresas assinantes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Escolha quais módulos cada empresa tem acesso. Cadastro de empresa nova
        continua pela CLI de onboarding.
      </p>

      <div className="mt-6">
        <CompaniesPanel />
      </div>
    </div>
  );
}
