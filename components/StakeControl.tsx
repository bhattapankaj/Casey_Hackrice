"use client";

import { Check } from "lucide-react";
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
              aria-label={`Stake ${stake}${selected ? ", selected" : ""}`}
              onClick={() => onChange(stake)}
              className={`flex cursor-pointer flex-col items-center gap-2 transition-opacity duration-150 active:scale-95 disabled:cursor-default disabled:opacity-45 ${
                selected ? "opacity-100" : "opacity-70 hover:opacity-100"
              }`}
            >
              <span
                className={`relative flex size-[56px] items-center justify-center rounded-full text-ink transition-all duration-150 ${
                  selected
                    ? "scale-110 bg-gold ring-4 ring-cream ring-offset-3 ring-offset-felt shadow-[0_8px_20px_rgba(37,33,33,0.38)]"
                    : "bg-cream shadow-[0_2px_6px_rgba(37,33,33,0.28)] hover:-translate-y-0.5"
                }`}
                style={{
                  boxShadow: selected
                    ? "0 8px 20px rgba(37,33,33,0.38), inset 0 0 0 2px #F5EFE0"
                    : "0 2px 6px rgba(37,33,33,0.28), inset 0 0 0 1.5px #CF9C2D",
                }}
              >
                <span className="font-serif text-[18px] font-semibold">{stake}</span>
                {selected ? (
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border-2 border-cream bg-felt-deep text-cream shadow-sm">
                    <Check size={11} strokeWidth={3} aria-hidden />
                  </span>
                ) : null}
              </span>
              <span
                className={`font-label text-[11px] tracking-[0.08em] ${
                  selected ? "font-semibold text-cream" : "text-cream/60"
                }`}
              >
                {selected ? "Selected" : `${stake} chips`}
              </span>
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
