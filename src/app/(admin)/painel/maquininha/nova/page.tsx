import { requireMaquininhaAccess } from "../require-access";
import { MaquininhaFormScreen } from "../maquininha-form-screen";

export default async function NovaMaquininhaPage() {
  await requireMaquininhaAccess();
  return <MaquininhaFormScreen />;
}
