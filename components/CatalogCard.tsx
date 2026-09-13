"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { MirroredCorner, PlayingCardShell } from "@/components/ArtifactCard";
import { CATEGORY_META } from "@/lib/cases/categories";
import type { CaseCategory, CaseRank } from "@/lib/cases/schema";

export type CatalogStatus = "not_attempted" | "attempted" | "cleared";

type CatalogCardProps = {
  rank: CaseRank;
  category: CaseCategory;
  title: string;
  estimatedMinutes: number;
  status?: CatalogStatus;
  href?: string;
  upcoming?: boolean;
  width?: string;
};

function Corner({ rank, category }: { rank: CaseRank; category: CaseCategory }) {
  const Icon = CATEGORY_META[category].icon;
  return (
    <div className="flex w-5 flex-col items-center gap-0.5" aria-hidden>
      <span className="font-serif text-[15px] leading-none font-semibold text-ink">{rank}</span>
      <Icon size={14} strokeWidth={1.75} className="text-gold" />
    </div>
  );
}

function CatalogFace({
  rank,
  category,
  title,
  estimatedMinutes,
  status,
  upcoming,
  width,
}: CatalogCardProps) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  return (
    <PlayingCardShell width={width ?? "w-[240px]"}>
      <div className="pointer-events-none absolute inset-[14px]" aria-hidden>
        <div className="absolute top-0 left-0">
          <Corner rank={rank} category={category} />
        </div>
        <MirroredCorner>
          <Corner rank={rank} category={category} />
        </MirroredCorner>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <Icon
          size={28}
          strokeWidth={1.75}
          aria-hidden
          className="text-gold opacity-[0.18]"
        />
        <p className="mt-2 font-serif text-[16px] leading-tight font-semibold text-ink">
          {title}
        </p>
        {status === "cleared" ? (
          <span aria-hidden className="mt-2 block h-px w-12 bg-gold" />
        ) : null}
        <p className="mt-2 font-label text-[10px] tracking-[0.12em] text-ink/55 uppercase">
          {meta.label}
        </p>
      </div>

      {upcoming ? null : (
        <div className="absolute inset-x-8 bottom-7 text-center">
          <p className="flex items-center justify-center gap-1 font-sans text-[11px] text-ink/70">
            {status === "cleared" ? (
              <>
                <Check size={12} strokeWidth={2.25} aria-hidden className="text-gold" />
                Cleared
              </>
            ) : status === "attempted" ? (
              "Attempted"
            ) : (
              "Not attempted"
            )}
            <span aria-hidden className="text-ink/35">
              ·
            </span>
            {estimatedMinutes} min
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
    props.status === "cleared"
      ? "Cleared"
      : props.status === "attempted"
        ? "Attempted"
        : "Not attempted";

  return (
    <Link
      href={props.href}
      aria-label={`${label}. ${statusLabel}. About ${props.estimatedMinutes} minutes.`}
      className="block rounded-[12px]"
    >
      <CatalogFace {...props} />
    </Link>
  );
}
