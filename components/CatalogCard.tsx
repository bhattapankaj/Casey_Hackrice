"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { MirroredCorner, PlayingCardShell } from "@/components/ArtifactCard";
import { CASINO_SUITS, type CasinoSuit } from "@/components/CasinoDetails";
import { CATEGORY_META } from "@/lib/cases/categories";
import type { CaseCategory, CaseRank } from "@/lib/cases/schema";
import type { Hand } from "@/lib/engine/hand";

export type CatalogStatus = "not_attempted" | "attempted" | "cleared";

type CatalogCardProps = {
  rank: CaseRank;
  category: CaseCategory;
  title: string;
  estimatedMinutes: number;
  status?: CatalogStatus;
  bestHand?: Hand | null;
  href?: string;
  upcoming?: boolean;
  width?: string;
  suit?: CasinoSuit;
};

function Corner({
  rank,
  suit,
}: {
  rank: CaseRank;
  suit: CasinoSuit;
}) {
  const theme = CASINO_SUITS[suit];
  return (
    <div className="flex w-5 flex-col items-center gap-0.5" aria-hidden>
      <span className="font-serif text-[15px] leading-none font-semibold text-ink">{rank}</span>
      <span
        className="font-serif text-[17px] leading-none"
        style={{ color: theme.accent }}
      >
        {theme.symbol}
      </span>
    </div>
  );
}

function CatalogFace({
  rank,
  category,
  title,
  estimatedMinutes,
  status,
  bestHand,
  upcoming,
  width,
  suit = "diamonds",
}: CatalogCardProps) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  const theme = CASINO_SUITS[suit];
  const settled = status === "cleared" || status === "attempted";

  return (
    <PlayingCardShell
      width={width ?? "w-[240px]"}
      className="transition-transform duration-150 group-hover:-translate-y-1 group-hover:shadow-[0_12px_24px_rgba(17,28,22,0.42)]"
    >
      <span
        aria-hidden
        className="absolute -right-5 -bottom-11 font-serif text-[150px] leading-none opacity-[0.055]"
        style={{ color: theme.accent }}
      >
        {theme.symbol}
      </span>
      <div className="pointer-events-none absolute inset-[14px]" aria-hidden>
        <div className="absolute top-0 left-0">
          <Corner rank={rank} suit={suit} />
        </div>
        <MirroredCorner>
          <Corner rank={rank} suit={suit} />
        </MirroredCorner>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-full border bg-cream-dim/35"
          style={{ borderColor: theme.accent, color: theme.accent }}
        >
          <Icon size={22} strokeWidth={1.7} />
        </span>
        <p className="mt-3 font-serif text-[18px] leading-tight font-semibold text-ink">
          {title}
        </p>
        {settled ? (
          <span aria-hidden className="mt-2 block h-px w-12" style={{ background: theme.accent }} />
        ) : null}
        <p className="mt-2 font-label text-[10px] tracking-[0.12em] text-ink/55 uppercase">
          {meta.label}
        </p>
        <p
          aria-hidden
          className="mt-2 font-label text-[8px] tracking-[0.18em] uppercase"
          style={{ color: theme.accent }}
        >
          {upcoming ? "Held by the dealer" : `${theme.name} file`}
        </p>
      </div>

      {upcoming ? (
        <div className="absolute inset-x-8 bottom-7 text-center">
          <p className="font-label text-[9px] tracking-[0.13em] text-ink/45 uppercase">
            Coming next
          </p>
        </div>
      ) : (
        <div className="absolute inset-x-8 bottom-7 text-center">
          <p className="flex items-center justify-center gap-1.5 font-sans text-[11px] text-ink/70">
            {status === "cleared" && bestHand ? (
              <>
                <Check size={12} strokeWidth={2.25} aria-hidden className="text-gold" />
                {bestHand}
              </>
            ) : status === "attempted" ? (
              "Case closed"
            ) : (
              "Not attempted"
            )}
            <span aria-hidden className="text-ink/35">
              ·
            </span>
            {estimatedMinutes} min
          </p>
          <p className="mt-2 font-label text-[9px] tracking-[0.14em] text-felt-deep uppercase">
            {settled ? "Practice replay" : "Open ranked case"}
          </p>
        </div>
      )}
    </PlayingCardShell>
  );
}

export function CatalogCard(props: CatalogCardProps) {
  const meta = CATEGORY_META[props.category];
  const label = `${props.title}, ${meta.label}, rank ${props.rank}`;

  if (props.upcoming || !props.href) {
    return (
      <div aria-disabled="true" aria-label={`${label}, coming next`} className="opacity-60">
        <CatalogFace {...props} upcoming />
      </div>
    );
  }

  const statusLabel =
    props.status === "cleared" && props.bestHand
      ? `Case closed with ${props.bestHand}. Practice replay`
      : props.status === "cleared"
        ? "Case closed. Practice replay"
        : props.status === "attempted"
          ? "Case closed. Practice replay"
          : "Not attempted. Ranked play";

  return (
    <Link
      href={props.href}
      aria-label={`${label}. ${statusLabel}. About ${props.estimatedMinutes} minutes.`}
      className="group block rounded-[12px]"
    >
      <CatalogFace {...props} />
    </Link>
  );
}
