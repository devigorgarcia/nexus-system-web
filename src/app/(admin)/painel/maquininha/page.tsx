import { requireMaquininhaAccess } from "./require-access";
import { MaquininhaListScreen } from "./maquininha-list-screen";

export default async function MaquininhaPage() {
  await requireMaquininhaAccess();
  return <MaquininhaListScreen />;
}
