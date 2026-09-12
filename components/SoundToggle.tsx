"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  setSoundEnabled,
  soundEnabled,
  subscribeToSound,
  unlockSound,
} from "@/lib/sound";

export function SoundToggle() {
  const [on, setOn] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOn(soundEnabled());
    setReady(true);
    return subscribeToSound(setOn);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        unlockSound();
        setSoundEnabled(!on);
      }}
      aria-pressed={on}
      aria-label={on ? "Turn table sound off" : "Turn table sound on"}
      className="inline-flex items-center gap-2 font-label text-[12px] tracking-[0.08em] text-cream/80 transition-colors duration-150 hover:text-cream"
    >
      {on ? (
        <Volume2 size={20} strokeWidth={1.75} aria-hidden />
      ) : (
        <VolumeX size={20} strokeWidth={1.75} aria-hidden />
      )}
      <span>{ready && !on ? "Sound off" : "Sound on"}</span>
    </button>
  );
}
