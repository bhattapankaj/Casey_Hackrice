import type { CSSProperties } from "react";

export type CasinoSuit = "diamonds" | "spades" | "hearts" | "clubs";

export type CasinoSuitTheme = {
  name: string;
  symbol: string;
  accent: string;
};

export const CASINO_SUITS: Record<CasinoSuit, CasinoSuitTheme> = {
  diamonds: {
    name: "Diamonds",
    symbol: "♦",
    accent: "var(--color-red)",
  },
  spades: {
    name: "Spades",
    symbol: "♠",
    accent: "var(--color-ink)",
  },
  hearts: {
    name: "Hearts",
    symbol: "♥",
    accent: "var(--color-red)",
  },
  clubs: {
    name: "Clubs",
    symbol: "♣",
    accent: "var(--color-felt-deep)",
  },
};

export const CASINO_SUIT_ORDER: readonly CasinoSuit[] = [
  "diamonds",
  "spades",
  "hearts",
  "clubs",
];

export function SuitMarks({
  onCream = false,
  className = "",
}: {
  onCream?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-label="Diamonds, spades, hearts, and clubs"
      className={`inline-flex items-center gap-2 font-serif text-[17px] ${
        onCream ? "text-ink/65" : "text-cream/65"
      } ${className}`}
    >
      <span className="text-red">♦</span>
      <span>♠</span>
      <span className="text-red">♥</span>
      <span>♣</span>
    </span>
  );
}

export function CasinoChip({
  label,
  size = 54,
  accent = "var(--color-gold)",
  className = "",
  decorative = false,
}: {
  label: string | number;
  size?: number;
  accent?: string;
  className?: string;
  decorative?: boolean;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `repeating-conic-gradient(from -10deg, ${accent} 0deg 18deg, var(--color-cream) 18deg 36deg)`,
  };

  return (
    <span
      aria-hidden={decorative || undefined}
      className={`relative inline-grid shrink-0 place-items-center rounded-full border border-cream/80 shadow-[0_6px_13px_rgba(20,28,23,0.38)] ${className}`}
      style={style}
    >
      <span
        aria-hidden
        className="absolute rounded-full border border-ink/15 bg-cream"
        style={{ inset: Math.max(6, Math.round(size * 0.14)) }}
      />
      <span
        aria-hidden
        className="absolute rounded-full border border-dashed"
        style={{
          inset: Math.max(9, Math.round(size * 0.22)),
          borderColor: accent,
        }}
      />
      <span className="relative font-serif text-[14px] leading-none font-bold text-ink">
        {label}
      </span>
    </span>
  );
}
