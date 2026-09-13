import { BoardAccessGate } from "@/components/BoardAccessGate";
import { Leaderboard } from "@/components/Leaderboard";
import { SiteNav } from "@/components/SiteNav";

export default function BoardPage() {
  return (
    <BoardAccessGate>
      <SiteNav />
      <Leaderboard />
    </BoardAccessGate>
  );
}
