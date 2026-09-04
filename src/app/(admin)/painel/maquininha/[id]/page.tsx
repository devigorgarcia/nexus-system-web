import { requireMaquininhaAccess } from "../require-access";
import { MaquininhaFormScreen } from "../maquininha-form-screen";

export default async function EditarMaquininhaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMaquininhaAccess();
  const { id } = await params;
  return <MaquininhaFormScreen machineId={id} />;
}
