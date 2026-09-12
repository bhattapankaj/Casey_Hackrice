"use client";

import { useEffect } from "react";
import { unlockSound } from "@/lib/sound";

/** Browsers keep audio silent until the player interacts, so unlock on the first gesture. */
export function SoundUnlock() {
  useEffect(() => {
    function unlock() {
      unlockSound();
    }

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return null;
}
