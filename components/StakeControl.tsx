"use client";

import type { Stake } from "@/lib/engine/chips";
import { canAffordStake, STAKE_OPTIONS } from "@/lib/engine/chips";

const STAKE_CHIP_ACCENT: Record<Stake, string> = {
  10: "var(--color-gold)",
  25: "var(--color-red)",
  50: "var(--color-ink)",
};

const STAKE_CHIP_SELECTED_TEXT: Record<Stake, string> = {
  10: "var(--color-ink)",
  25: "var(--color-cream)",
  50: "var(--color-cream)",
};

type StakeControlProps = {
  value: Stake;
  onChange: (stake: Stake) => void;
  availableChips: number;
  disabled?: boolean;
};

export function StakeControl({
  value,
  onChange,
  availableChips,
  disabled = false,
}: StakeControlProps) {
  return (
    <div className="mt-6 flex w-full max-w-[28rem] flex-col items-center">
      <p className="font-serif text-[19px] font-semibold text-cream">How sure are you?</p>
      <div className="mt-4 flex items-start justify-center gap-6">
        {STAKE_OPTIONS.map((stake) => {
          const selected = value === stake;
          const accent = STAKE_CHIP_ACCENT[stake];
          const affordable = canAffordStake(availableChips, stake);
          return (
            <button
              key={stake}
              type="button"
              disabled={disabled || !affordable}
              aria-pressed={selected}
              aria-label={`Stake ${stake}${
                !affordable ? `, unavailable with ${availableChips} chips` : selected ? ", selected" : ""
              }`}
              onClick={() => onChange(stake)}
              className={`flex cursor-pointer flex-col items-center gap-2 transition-opacity duration-150 active:scale-95 disabled:cursor-default disabled:opacity-45 ${
                selected ? "opacity-100" : "opacity-75 hover:opacity-100"
              }`}
            >
              <span
                className={`relative flex size-[64px] items-center justify-center rounded-full border border-cream/70 transition-all duration-150 ${
                  selected
                    ? "scale-110 ring-2 ring-cream ring-offset-[3px] ring-offset-gold"
                    : "hover:-translate-y-0.5"
                }`}
                style={{
                  backgroundImage: `repeating-conic-gradient(from -9deg, ${accent} 0deg 18deg, var(--color-cream) 18deg 36deg)`,
                  boxShadow: selected
                    ? "0 10px 22px rgba(37,33,33,0.42), inset 0 1px 1px rgba(255,255,255,0.4)"
                    : "0 4px 9px rgba(37,33,33,0.34), inset 0 1px 1px rgba(255,255,255,0.45)",
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-[7px] rounded-full border border-ink/15 bg-cream shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)]"
                />
                <span
                  aria-hidden
                  className="absolute inset-[10px] rounded-full border-2 border-dashed"
                  style={{ borderColor: accent }}
                />
                <span
                  aria-hidden
                  className="absolute inset-[14px] rounded-full border border-ink/15 transition-colors duration-150"
                  style={{
                    backgroundColor: selected ? accent : "var(--color-cream-dim)",
                  }}
                />
                <span
                  className="relative font-serif text-[18px] font-bold tabular-nums"
                  style={{
                    color: selected ? STAKE_CHIP_SELECTED_TEXT[stake] : "var(--color-ink)",
                  }}
                >
                  {stake}
                </span>
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
        {availableChips} chips available. Your stake returns with equal winnings if you are
        right. Lose only the stake if you are wrong.
      </p>
    </div>
  );
}
