import Link from "next/link";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CompaniesPanel } from "./companies-panel";

export default function PlatformCompaniesPage() {
  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Escolha um cliente pelo nome ou código e habilite os módulos que ele contratou."
        actions={
          <Button render={<Link href="/painel-admin/novo-cliente" />}>
            Novo cliente
          </Button>
        }
      />
      <PageBody>
        <CompaniesPanel />
      </PageBody>
    </div>
  );
}
