import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { CompaniesPanel } from "./companies-panel";

export default function PlatformCompaniesPage() {
  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Escolha um cliente pelo nome ou código e habilite os módulos que ele contratou."
      />
      <PageBody>
        <CompaniesPanel />
      </PageBody>
    </div>
  );
}
