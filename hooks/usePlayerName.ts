"use client";

import { useCallback, useEffect, useState } from "react";
import {
  parsePlayerProfile,
  PLAYER_PROFILE_STORAGE_KEY,
  serializePlayerProfile,
} from "@/lib/player-profile";

export function usePlayerName() {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setName(parsePlayerProfile(window.localStorage.getItem(PLAYER_PROFILE_STORAGE_KEY))?.name ?? null);
    } catch {
      setName(null);
    } finally {
      setReady(true);
    }
  }, []);

  const saveName = useCallback((nextName: string) => {
    const serialized = serializePlayerProfile(nextName);
    const profile = parsePlayerProfile(serialized);
    if (!profile) {
      return false;
    }
    try {
      window.localStorage.setItem(PLAYER_PROFILE_STORAGE_KEY, serialized);
    } catch {
      // Keep the current round playable when storage is blocked.
    }
    setName(profile.name);
    return true;
  }, []);

  return { name, ready, saveName };
}
