import { CaseCatalog } from "@/components/CaseCatalog";
import { PlayerAccessGate } from "@/components/PlayerAccessGate";

export default function TablePage() {
  return (
    <PlayerAccessGate>
      <CaseCatalog />
    </PlayerAccessGate>
  );
}
