import { sanitizeNickname } from "@/lib/board/submission";
import { parsePlayerProfile } from "@/lib/player-profile";
import { parseProgress } from "@/lib/progress";

export function hasBoardAccess(
  serializedPlayer: string | null,
  serializedProgress: string | null,
): boolean {
  const player = parsePlayerProfile(serializedPlayer);
  const progress = parseProgress(serializedProgress);
  const nickname = progress.nickname;

  return Boolean(
    player &&
      nickname &&
      progress.nicknameAsked &&
      sanitizeNickname(nickname) === nickname,
  );
}
