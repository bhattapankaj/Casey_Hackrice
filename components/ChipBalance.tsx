"use client";

import { useEffect, useRef, useState } from "react";
import { Coins } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { PROGRESS_STORAGE_KEY, parseProgress, readStoredProgress } from "@/lib/progress";
import { STARTING_CHIPS } from "@/lib/engine/chips";

type ChipBalanceProps = {
  value?: number;
};

export function ChipBalance({ value }: ChipBalanceProps) {
  const reduce = useReducedMotion();
  const [chips, setChips] = useState(STARTING_CHIPS);
  const [display, setDisplay] = useState(STARTING_CHIPS);
  const displayRef = useRef(STARTING_CHIPS);

  useEffect(() => {
    if (typeof value === "number") {
      setChips(value);
      return;
    }
    function refresh() {
      setChips(readStoredProgress().chips);
    }
    refresh();
    function onStorage(event: StorageEvent) {
      if (event.key && event.key !== PROGRESS_STORAGE_KEY) return;
      setChips(parseProgress(event.newValue).chips);
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("casey-progress", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("casey-progress", refresh);
    };
  }, [value]);

  useEffect(() => {
    if (reduce) {
      displayRef.current = chips;
      setDisplay(chips);
      return;
    }
    const from = displayRef.current;
    const to = chips;
    if (from === to) return;
    const started = performance.now();
    let frame = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - started) / 400);
      const next = Math.round(from + (to - from) * t);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    }
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [chips, reduce]);

  return (
    <p
      aria-live="polite"
      className="inline-flex min-h-[44px] items-center gap-1.5 text-gold"
      title="Table chips"
    >
      <Coins size={14} strokeWidth={1.75} aria-hidden />
      <span className="font-serif text-[17px] leading-none font-semibold tabular-nums">
        {display}
      </span>
      <span className="sr-only">chips</span>
    </p>
  );
}
