"use client";

import type { Stake } from "@/lib/engine/chips";
import { STAKE_OPTIONS } from "@/lib/engine/chips";

type StakeControlProps = {
  value: Stake;
  onChange: (stake: Stake) => void;
  disabled?: boolean;
};

export function StakeControl({ value, onChange, disabled = false }: StakeControlProps) {
  return (
    <div className="mt-6 flex w-full max-w-[28rem] flex-col items-center">
      <p className="font-serif text-[19px] font-semibold text-cream">How sure are you?</p>
      <div className="mt-4 flex items-start justify-center gap-6">
        {STAKE_OPTIONS.map((stake) => {
          const selected = value === stake;
          return (
            <button
              key={stake}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`Stake ${stake}`}
              onClick={() => onChange(stake)}
              className="flex flex-col items-center gap-2 disabled:opacity-45"
            >
              <span
                className={`relative flex size-[56px] items-center justify-center rounded-full bg-cream text-ink shadow-[0_2px_6px_rgba(37,33,33,0.28)] ${
                  selected ? "ring-2 ring-gold ring-offset-2 ring-offset-felt" : ""
                }`}
                style={{ boxShadow: "0 2px 6px rgba(37,33,33,0.28), inset 0 0 0 1.5px #CF9C2D" }}
              >
                <span className="font-serif text-[18px] font-semibold">{stake}</span>
              </span>
              <span className="font-label text-[11px] tracking-[0.08em] text-cream/70">{stake}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 max-w-[36ch] text-center text-[13px] leading-relaxed text-cream/70">
        Win the stake if you are right. Lose it if you are wrong.
      </p>
    </div>
  );
}
