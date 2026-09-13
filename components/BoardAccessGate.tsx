"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { hasBoardAccess } from "@/lib/board/access";
import { PLAYER_PROFILE_STORAGE_KEY } from "@/lib/player-profile";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress";

export function BoardAccessGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    let allowed = false;
    try {
      allowed = hasBoardAccess(
        window.localStorage.getItem(PLAYER_PROFILE_STORAGE_KEY),
        window.localStorage.getItem(PROGRESS_STORAGE_KEY),
      );
    } catch {
      allowed = false;
    }

    if (!allowed) {
      router.replace("/");
      return;
    }
    setGranted(true);
  }, [router]);

  if (!granted) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[680px] items-center justify-center px-5 text-cream">
        <p role="status" className="font-serif text-[18px] text-cream/75">
          Checking your table nameplate...
        </p>
      </main>
    );
  }

  return children;
}
