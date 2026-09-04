import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { NovoClienteScreen } from "./novo-cliente-screen";

export default function NovoClientePage() {
  return (
    <div>
      <PageHeader
        title="Novo cliente"
        description="Cadastra a empresa, cria o login do dono e envia a senha de acesso por e-mail."
      />
      <PageBody>
        <NovoClienteScreen />
      </PageBody>
    </div>
  );
}
