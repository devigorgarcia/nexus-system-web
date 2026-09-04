import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { SimulacaoPanel } from "./simulacao-panel";

export default function SimulacaoPage() {
  return (
    <div>
      <PageHeader
        title="Simulação"
        description="Estime a mensalidade do cliente: salário mínimo vezes a soma dos pesos dos módulos ativos. Ajuste as porcentagens à vontade — não altera o contrato, só a conta."
      />
      <PageBody>
        <SimulacaoPanel />
      </PageBody>
    </div>
  );
}
