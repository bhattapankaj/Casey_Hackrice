"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  FileCheck2,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import {
  fetchSharedBoard,
  getOrCreateBoardSubmissionId,
  postCurrentBoard,
} from "@/lib/board/client";
import { localBoardPayload, sortBoardRows } from "@/lib/board/local";
import type { BoardRow, BoardStats } from "@/lib/board/types";
import { CASE_ORDER } from "@/lib/cases/registry";
import { readStoredProgress } from "@/lib/progress";

const ALL_CASES = CASE_ORDER.length;

type RankedRow = {
  row: BoardRow;
  rank: number;
};

type SuitTheme = {
  symbol: string;
  name: string;
  accent: string;
  cards: readonly [string, string];
};

const SUIT_THEMES: readonly SuitTheme[] = [
  {
    symbol: "♦",
    name: "Diamonds",
    accent: "var(--color-red)",
    cards: ["A♦", "K♦"],
  },
  {
    symbol: "♠",
    name: "Spades",
    accent: "var(--color-ink)",
    cards: ["Q♠", "J♠"],
  },
  {
    symbol: "♥",
    name: "Hearts",
    accent: "var(--color-red)",
    cards: ["10♥", "9♥"],
  },
  {
    symbol: "♣",
    name: "Clubs",
    accent: "var(--color-felt-deep)",
    cards: ["8♣", "7♣"],
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function themeForRank(rank: number): SuitTheme {
  return SUIT_THEMES[(Math.max(1, rank) - 1) % SUIT_THEMES.length] ?? SUIT_THEMES[0];
}

function hasMasterBadge(row: BoardRow): boolean {
  return row.casesCleared >= ALL_CASES;
}

function SuitMarks({ ink = false }: { ink?: boolean }) {
  return (
    <div
      aria-label="Diamonds, spades, hearts, and clubs"
      className={cx(
        "flex items-center gap-2 font-serif text-[17px]",
        ink ? "text-ink/60" : "text-cream/65",
      )}
    >
      <span className="text-red">♦</span>
      <span>♠</span>
      <span className="text-red">♥</span>
      <span>♣</span>
    </div>
  );
}

function CasinoChip({
  label,
  size = 42,
  accent = "var(--color-gold)",
}: {
  label: string | number;
  size?: number;
  accent?: string;
}) {
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center rounded-full border border-cream/80 shadow-[0_5px_10px_rgba(20,28,23,0.35)]"
      style={{
        width: size,
        height: size,
        backgroundImage:
          "repeating-conic-gradient(from -10deg, " +
          accent +
          " 0deg 18deg, var(--color-cream) 18deg 36deg)",
      }}
    >
      <span
        aria-hidden
        className="absolute rounded-full border border-ink/15 bg-cream"
        style={{ inset: Math.max(5, Math.round(size * 0.14)) }}
      />
      <span
        aria-hidden
        className="absolute rounded-full border border-dashed"
        style={{
          inset: Math.max(8, Math.round(size * 0.22)),
          borderColor: accent,
        }}
      />
      <span className="relative font-serif text-[14px] leading-none font-bold text-ink">
        {label}
      </span>
    </span>
  );
}

function MasterBadge({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center drop-shadow-[0_3px_7px_rgba(37,33,33,0.24)]"
      title={"Master of Deduction: cleared all " + ALL_CASES + " cases"}
    >
      <Image
        src="/casey-deduction-badge.svg"
        alt={"Master of Deduction badge, all " + ALL_CASES + " cases cleared"}
        width={size}
        height={size}
      />
    </span>
  );
}

function TableStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-full border border-gold/45 bg-ink/80 py-2 pr-4 pl-2 shadow-[0_7px_16px_rgba(20,28,23,0.3)]">
      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-cream/25 bg-felt text-gold">
        <Icon size={16} strokeWidth={1.8} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate font-label text-[8px] tracking-[0.12em] text-cream/55 uppercase">
          {label}
        </p>
        <p className="font-serif text-[19px] leading-tight font-semibold text-cream">
          {value}
        </p>
      </div>
    </div>
  );
}

function HoleCards({ rank }: { rank: number }) {
  const theme = themeForRank(rank);
  return (
    <div
      aria-label={theme.name + " playing cards"}
      className="absolute top-0 left-1/2 flex -translate-x-1/2 items-end justify-center"
    >
      {theme.cards.map((card, index) => (
        <span
          key={card}
          className={cx(
            "grid h-[62px] w-[44px] place-items-center rounded-[7px] border-2 border-gold bg-cream font-serif text-[15px] font-bold shadow-[0_6px_13px_rgba(20,28,23,0.38)]",
            index === 0
              ? "translate-x-1 rotate-[-10deg]"
              : "-translate-x-1 rotate-[10deg]",
          )}
          style={{ color: theme.accent }}
        >
          {card}
        </span>
      ))}
    </div>
  );
}

function PokerSeat({ rank, row, current }: RankedRow & { current: boolean }) {
  const theme = themeForRank(rank);
  const first = rank === 1;

  return (
    <article
      aria-label={row.nickname + ", rank " + rank + ", " + theme.name + " seat"}
      className={cx(
        "relative pt-11 md:min-w-0",
        rank === 1
          ? "md:order-2 md:-translate-y-4"
          : rank === 2
            ? "md:order-1"
            : "md:order-3",
      )}
    >
      <HoleCards rank={rank} />
      <div
        className={cx(
          "surface-cream relative min-h-[224px] overflow-hidden rounded-[18px] border-2 bg-cream p-4 pt-7 text-ink shadow-[0_17px_34px_rgba(17,28,22,0.4)]",
          first && "ring-2 ring-gold ring-offset-2 ring-offset-felt",
          current && "shadow-[0_17px_34px_rgba(17,28,22,0.4),inset_0_0_0_3px_rgba(207,156,45,0.2)]",
        )}
        style={{ borderColor: first || current ? "var(--color-gold)" : theme.accent }}
      >
        <span
          aria-hidden
          className="absolute -right-3 -bottom-10 font-serif text-[150px] leading-none opacity-[0.07]"
          style={{ color: theme.accent }}
        >
          {theme.symbol}
        </span>
        <div className="absolute top-3 right-3">
          <CasinoChip label={rank} size={39} accent={first ? "var(--color-gold)" : theme.accent} />
        </div>

        <p className="font-label text-[8px] tracking-[0.17em] text-ink/45 uppercase">
          {first ? "Table leader" : theme.name + " seat"}
        </p>
        <div className="mt-4 flex min-w-0 flex-wrap items-center justify-center gap-2 px-10 text-center">
          <h3
            data-podium-nickname={row.nickname}
            className="max-w-full [overflow-wrap:anywhere] font-serif text-[21px] leading-tight font-semibold"
          >
            {row.nickname}
          </h3>
          {hasMasterBadge(row) ? <MasterBadge size={30} /> : null}
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center justify-center gap-2 px-4 text-center">
          <p
            data-podium-username={row.username}
            className="max-w-full [overflow-wrap:anywhere] font-label text-[9px] leading-relaxed tracking-[0.06em] text-felt-deep"
          >
            @{row.username}
          </p>
          {current ? (
            <span className="rounded-full border border-felt/35 bg-felt/[0.06] px-2 py-0.5 font-label text-[8px] tracking-[0.13em] text-felt-deep uppercase">
              You
            </span>
          ) : null}
        </div>

        <div className="mt-4 border-t border-ink/10 pt-3">
          <p className="font-label text-[8px] tracking-[0.14em] text-ink/40 uppercase">
            Verified score
          </p>
          <p className="mt-0.5 font-serif text-[31px] leading-none font-bold tracking-[-0.02em]">
            {row.score.toLocaleString()}
          </p>
        </div>

        <dl className="relative mt-4 grid grid-cols-3 gap-2">
          <div>
            <dt className="font-label text-[7px] tracking-[0.1em] text-ink/40 uppercase">
              Cases
            </dt>
            <dd className="mt-0.5 text-[12px] font-semibold">
              {row.casesCleared} / {ALL_CASES}
            </dd>
          </div>
          <div>
            <dt className="font-label text-[7px] tracking-[0.1em] text-ink/40 uppercase">
              Hand
            </dt>
            <dd className="mt-0.5 truncate text-[11px] font-semibold">
              {row.bestHand ?? "High card"}
            </dd>
          </div>
          <div>
            <dt className="font-label text-[7px] tracking-[0.1em] text-ink/40 uppercase">
              Stack
            </dt>
            <dd className="mt-0.5 font-serif text-[13px] font-bold text-felt-deep">
              {row.chips} chips
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function PokerTable({
  podium,
  stats,
  youId,
}: {
  podium: RankedRow[];
  stats: BoardStats;
  youId: string | null;
}) {
  return (
    <section
      aria-labelledby="podium-title"
      className="relative mt-6 rounded-[42px] border-[9px] border-ink bg-gold p-[3px] shadow-[0_28px_60px_rgba(16,31,23,0.5),inset_0_0_0_1px_rgba(245,239,224,0.3)] sm:rounded-[70px] sm:border-[12px]"
    >
      <div
        className="relative overflow-hidden rounded-[29px] border border-cream/40 bg-felt-deep px-4 py-7 sm:rounded-[54px] sm:px-8 sm:py-9"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(53,106,80,0.99) 0%, rgba(42,84,64,0.99) 74%), repeating-linear-gradient(36deg, rgba(245,239,224,0.025) 0 1px, transparent 1px 7px)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-5 rounded-[26px] border border-dashed border-cream/20 sm:inset-8 sm:rounded-[50%]"
        />
        <span aria-hidden className="absolute top-5 left-7 font-serif text-[32px] text-cream/15">
          ♠
        </span>
        <span aria-hidden className="absolute top-5 right-7 font-serif text-[32px] text-red/25">
          ♥
        </span>
        <span aria-hidden className="absolute bottom-5 left-7 font-serif text-[32px] text-red/25">
          ♦
        </span>
        <span aria-hidden className="absolute right-7 bottom-5 font-serif text-[32px] text-cream/15">
          ♣
        </span>

        <div className="relative">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full border border-gold/55 bg-ink/80 px-4 py-1 font-label text-[8px] tracking-[0.22em] text-gold uppercase shadow-sm">
              Baker Street final table
            </span>
            <h2
              id="podium-title"
              className="mt-2 font-serif text-[27px] font-semibold text-cream sm:text-[32px]"
            >
              The sharpest minds at the table
            </h2>
            <p className="mt-1 text-[12px] text-cream/60">
              Top investigators by server-verified score
            </p>
          </div>

          <div
            aria-label="Case ledger summary"
            className="mx-auto mt-6 grid max-w-[820px] gap-2 sm:grid-cols-3"
          >
            <TableStat
              icon={UsersRound}
              label="Detectives tonight"
              value={String(stats.playersTonight)}
            />
            <TableStat
              icon={FileCheck2}
              label="Cases played"
              value={String(stats.casesPlayed)}
            />
            <TableStat
              icon={ShieldCheck}
              label="Fooled by case 01"
              value={
                stats.case01WrongPercent === null
                  ? "n/a"
                  : String(stats.case01WrongPercent) + "%"
              }
            />
          </div>

          <div className="mx-auto mt-12 grid max-w-[900px] gap-5 md:grid-cols-3 md:items-end md:gap-4">
            {podium.map(({ row, rank }) => (
              <PokerSeat
                key={"podium-" + row.id}
                rank={rank}
                row={row}
                current={row.id === youId || Boolean(row.you)}
              />
            ))}
          </div>

          <div className="mx-auto mt-7 flex w-fit items-center gap-3 rounded-full border border-cream/25 bg-ink/85 py-2 pr-4 pl-2 shadow-[0_7px_18px_rgba(16,31,23,0.35)]">
            <CasinoChip label="D" size={36} accent="var(--color-red)" />
            <div className="text-left">
              <p className="font-label text-[7px] tracking-[0.16em] text-cream/40 uppercase">
                House rule
              </p>
              <p className="text-[11px] font-semibold text-cream">
                Evidence decides the pot, never speed
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ rank, row, current }: RankedRow & { current: boolean }) {
  const theme = themeForRank(rank);
  const face = rank === 1 ? "A" : rank === 2 ? "K" : rank === 3 ? "Q" : String(rank);

  return (
    <tr
      className={cx(
        "group border-b border-cream/10 transition-colors last:border-0 hover:bg-cream/[0.04]",
        current && "bg-gold/[0.09] shadow-[inset_3px_0_0_#CF9C2D]",
      )}
    >
      <td className="py-3.5 pr-4 pl-1">
        <CasinoChip
          label={rank}
          size={38}
          accent={rank <= 3 ? theme.accent : "var(--color-felt)"}
        />
      </td>
      <td className="py-3.5 pr-6 text-[15px] text-cream">
        <div className="flex min-w-[190px] items-center gap-3">
          <span
            aria-label={theme.name}
            className="flex h-10 w-8 shrink-0 rotate-[-4deg] flex-col items-center justify-center rounded-[5px] border-2 border-gold bg-cream font-serif font-bold shadow-sm"
            style={{ color: theme.accent }}
          >
            <span className="text-[11px] leading-none">{face}</span>
            <span className="text-[15px] leading-none">{theme.symbol}</span>
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-serif text-[17px] font-semibold">{row.nickname}</span>
              {hasMasterBadge(row) ? <MasterBadge size={27} /> : null}
              {current ? (
                <span className="rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 font-label text-[8px] tracking-[0.12em] text-gold uppercase">
                  You
                </span>
              ) : null}
            </div>
            <span className="mt-0.5 block font-label text-[9px] tracking-[0.07em] text-gold">
              @{row.username}
            </span>
          </div>
        </div>
      </td>
      <td className="py-3.5 pr-6 text-[14px] text-cream/75">
        <span className="font-serif text-[17px] font-semibold text-cream">
          {row.casesCleared}
        </span>
        <span className="text-cream/35"> / {ALL_CASES}</span>
      </td>
      <td className="py-3.5 pr-6 text-[13px] text-cream/75">
        <span className="rounded-full border border-cream/15 bg-cream/[0.04] px-2.5 py-1 whitespace-nowrap">
          {row.bestHand ?? "High card"}
        </span>
      </td>
      <td className="py-3.5 pr-6">
        <span className="inline-flex items-center gap-2 font-serif text-[17px] font-semibold text-gold">
          <CasinoChip label="" size={23} accent="var(--color-gold)" />
          {row.chips}
        </span>
      </td>
      <td className="py-3.5 pr-1 text-right font-serif text-[20px] font-semibold text-cream">
        {row.score.toLocaleString()}
      </td>
    </tr>
  );
}

function MobileRow({ rank, row, current }: RankedRow & { current: boolean }) {
  const theme = themeForRank(rank);

  return (
    <article
      data-mobile-investigator={row.username}
      aria-label={row.nickname + ", rank " + rank}
      className={cx(
        "surface-cream relative overflow-hidden rounded-[15px] border-2 bg-cream p-4 text-ink",
        current ? "border-gold" : "border-cream-dim",
      )}
      style={{ boxShadow: current ? "inset 4px 0 0 var(--color-gold)" : undefined }}
    >
      <span
        aria-hidden
        className="absolute -right-2 -bottom-7 font-serif text-[92px] leading-none opacity-[0.07]"
        style={{ color: theme.accent }}
      >
        {theme.symbol}
      </span>
      <div className="relative flex items-start gap-3">
        <CasinoChip label={rank} size={43} accent={theme.accent} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="max-w-full [overflow-wrap:anywhere] font-serif text-[18px] leading-tight font-semibold">
              {row.nickname}
            </h3>
            {hasMasterBadge(row) ? <MasterBadge size={25} /> : null}
            {current ? (
              <span className="rounded-full border border-felt/35 px-2 py-0.5 font-label text-[8px] tracking-[0.12em] text-felt-deep uppercase">
                You
              </span>
            ) : null}
          </div>
          <p className="max-w-full [overflow-wrap:anywhere] font-label text-[9px] leading-relaxed tracking-[0.06em] text-felt-deep">
            @{row.username}
          </p>
        </div>
        <div className="text-right">
          <p className="font-label text-[7px] tracking-[0.13em] text-ink/40 uppercase">
            Score
          </p>
          <p className="font-serif text-[21px] font-semibold">{row.score.toLocaleString()}</p>
        </div>
      </div>

      <dl className="relative mt-4 grid grid-cols-3 gap-2 border-t border-ink/10 pt-3">
        <div>
          <dt className="font-label text-[7px] tracking-[0.1em] text-ink/40 uppercase">
            Cases
          </dt>
          <dd className="mt-1 font-serif text-[16px] font-semibold">
            {row.casesCleared}<span className="text-ink/35"> / {ALL_CASES}</span>
          </dd>
        </div>
        <div>
          <dt className="font-label text-[7px] tracking-[0.1em] text-ink/40 uppercase">
            Best hand
          </dt>
          <dd className="mt-1 truncate text-[11px] font-semibold text-ink/75">
            {row.bestHand ?? "High card"}
          </dd>
        </div>
        <div>
          <dt className="font-label text-[7px] tracking-[0.1em] text-ink/40 uppercase">
            Chips
          </dt>
          <dd className="mt-1 font-serif text-[17px] font-semibold text-felt-deep">
            {row.chips}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function LedgerHeader() {
  return (
    <header className="relative overflow-hidden rounded-[22px] border-2 border-gold bg-ink shadow-[0_20px_50px_rgba(18,31,24,0.42)]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_82%_22%,rgba(207,156,45,0.18),transparent_31%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 flex h-3 items-center justify-around bg-gold/10 px-3"
      >
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={index}
            className="size-1 rounded-full bg-gold/75 shadow-[0_0_7px_rgba(207,156,45,0.85)]"
          />
        ))}
      </div>

      <div className="relative grid gap-7 px-5 pt-8 pb-7 sm:px-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-label text-[9px] tracking-[0.22em] text-gold uppercase">
              Casey&apos;s private deduction room
            </p>
            <SuitMarks />
          </div>
          <h1 className="mt-3 max-w-[720px] font-serif text-[39px] leading-[0.94] font-semibold tracking-[-0.025em] text-cream sm:text-[56px]">
            The Deduction Ledger
          </h1>
          <p className="mt-4 max-w-[58ch] text-[14px] leading-relaxed text-cream/70 sm:text-[15px]">
            Take your seat at Baker Street&apos;s final table. Every score is rebuilt from
            verdicts and pinned evidence before it reaches the board.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Server verified", "Independent evidence", "No speed scoring"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-cream/15 bg-cream/[0.035] px-3 py-1 font-label text-[8px] tracking-[0.13em] text-cream/55 uppercase"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex" aria-hidden>
          <div className="relative grid size-[132px] place-items-center rounded-full border-2 border-gold bg-felt-deep shadow-[inset_0_0_0_8px_rgba(245,239,224,0.05),0_10px_24px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-3 rounded-full border border-dashed border-cream/30" />
            <Search size={43} strokeWidth={1.35} className="text-cream" />
            <span className="absolute right-1 bottom-2 grid size-9 place-items-center rounded-full border-2 border-ink bg-gold font-serif text-[13px] font-bold text-ink">
              221B
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function TournamentRegister({
  ranked,
  youId,
}: {
  ranked: RankedRow[];
  youId: string | null;
}) {
  return (
    <section aria-labelledby="all-investigators-title" className="mt-9">
      <div className="relative overflow-hidden rounded-t-[18px] border-2 border-b-0 border-gold bg-ink px-4 py-4 sm:px-5">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-32 bg-[linear-gradient(120deg,transparent,rgba(207,156,45,0.12))]"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CasinoChip label="B" size={42} accent="var(--color-red)" />
            <div>
              <p className="font-label text-[8px] tracking-[0.2em] text-gold uppercase">
                Baker Street tournament board
              </p>
              <h2
                id="all-investigators-title"
                className="font-serif text-[23px] font-semibold text-cream"
              >
                All investigators
              </h2>
            </div>
          </div>
          <div className="rounded-full border border-gold/35 bg-gold/[0.07] px-3 py-1.5 font-label text-[9px] tracking-[0.12em] text-cream/60 uppercase">
            <span className="text-gold">
              {ranked.length} {ranked.length === 1 ? "player" : "players"}
            </span>{" "}
            seated
          </div>
        </div>
      </div>

      <div className="grid gap-2 rounded-b-[18px] border-2 border-gold/70 bg-ink/70 p-3 sm:hidden">
        {ranked.map((entry) => (
          <MobileRow
            key={"mobile-" + entry.row.id}
            rank={entry.rank}
            row={entry.row}
            current={entry.row.id === youId || Boolean(entry.row.you)}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-b-[18px] border-2 border-gold/70 bg-ink/70 px-5 sm:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <caption className="sr-only">All player scores</caption>
          <thead>
            <tr className="border-b border-gold/35">
              <th scope="col" className="py-3 pr-4 pl-1 font-label text-[8px] tracking-[0.15em] text-gold uppercase">
                Rank
              </th>
              <th scope="col" className="py-3 pr-6 font-label text-[8px] tracking-[0.15em] text-gold uppercase">
                Player and alias
              </th>
              <th scope="col" className="py-3 pr-6 font-label text-[8px] tracking-[0.15em] text-gold uppercase">
                Cases
              </th>
              <th scope="col" className="py-3 pr-6 font-label text-[8px] tracking-[0.15em] text-gold uppercase">
                Best hand
              </th>
              <th scope="col" className="py-3 pr-6 font-label text-[8px] tracking-[0.15em] text-gold uppercase">
                Chips
              </th>
              <th scope="col" className="py-3 pr-1 text-right font-label text-[8px] tracking-[0.15em] text-gold uppercase">
                Verified score
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((entry) => (
              <Row
                key={entry.row.id}
                rank={entry.rank}
                row={entry.row}
                current={entry.row.id === youId || Boolean(entry.row.you)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Leaderboard() {
  const [entries, setEntries] = useState<BoardRow[]>([]);
  const [stats, setStats] = useState<BoardStats>({
    playersTonight: 0,
    casesPlayed: 0,
    case01WrongPercent: null,
  });
  const [localOnly, setLocalOnly] = useState(false);
  const [youId, setYouId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const progress = readStoredProgress();
      const submissionId = getOrCreateBoardSubmissionId();
      const local = localBoardPayload(progress, submissionId);

      if (progress.nickname && local.entries.length > 0) {
        await postCurrentBoard(progress.nickname);
      }
      const shared = await fetchSharedBoard();
      if (!active) return;
      if (shared.unavailable) {
        setLocalOnly(true);
        setEntries(local.entries);
        setStats(local.stats);
        setYouId(submissionId);
        setLoading(false);
        return;
      }
      const you = local.entries[0];
      const sharedYou = shared.entries.find((row) => row.id === submissionId);
      const merged = shared.entries.filter((row) => row.id !== submissionId);
      if (sharedYou) {
        merged.push({ ...sharedYou, you: true });
      } else if (you) {
        merged.push(you);
      }
      setEntries(sortBoardRows(merged));
      setStats(shared.stats);
      setYouId(submissionId);
      setLocalOnly(false);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const ranked = entries.map((row, index) => ({ row, rank: index + 1 }));
  const podium = ranked.slice(0, 3);
  const hasScores = !loading && entries.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col px-4 py-6 sm:px-6 sm:py-9">
      <LedgerHeader />

      {localOnly ? (
        <div className="mt-4 flex items-start gap-3 rounded-[12px] border border-gold/40 bg-ink/55 px-4 py-3 text-[13px] text-cream/70">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-gold" aria-hidden />
          <p>Showing your local scores. The shared board is unavailable.</p>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-8 flex items-center justify-center gap-3 rounded-[40px] border-[8px] border-ink bg-felt-deep py-16 text-cream/65 shadow-[0_22px_45px_rgba(20,40,30,0.35)]">
          <Search size={22} className="motion-safe:animate-pulse" aria-hidden />
          <p className="font-serif text-[18px]">Shuffling the table...</p>
        </div>
      ) : !hasScores ? (
        <section className="relative mx-auto mt-8 w-full max-w-[720px] overflow-hidden rounded-[46px] border-[9px] border-ink bg-felt-deep px-6 py-12 text-center text-cream shadow-[0_24px_50px_rgba(18,31,24,0.42)] sm:px-12">
          <div
            aria-hidden
            className="absolute inset-5 rounded-[34px] border border-dashed border-cream/20"
          />
          <div className="relative">
            <div className="flex justify-center">
              <SuitMarks />
            </div>
            <div className="mx-auto mt-7 flex w-fit items-center justify-center">
              <span className="grid h-[82px] w-[56px] translate-x-1 rotate-[-9deg] place-items-center rounded-[7px] border-2 border-gold bg-cream font-serif text-[25px] text-red shadow-[0_9px_18px_rgba(0,0,0,0.28)]">
                ♦
              </span>
              <span className="grid h-[82px] w-[56px] -translate-x-1 rotate-[9deg] place-items-center rounded-[7px] border-2 border-gold bg-cream font-serif text-[25px] text-ink shadow-[0_9px_18px_rgba(0,0,0,0.28)]">
                ♣
              </span>
            </div>
            <p className="mt-6 font-label text-[9px] tracking-[0.2em] text-gold uppercase">
              Empty pot
            </p>
            <h2 className="mt-1 font-serif text-[29px] font-semibold">No hands played yet</h2>
            <p className="mx-auto mt-2 max-w-[36ch] text-[15px] leading-relaxed text-cream/65">
              Finish a case and the first row is yours
            </p>
            <Link
              href="/play/case-01"
              className="mt-7 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold bg-cream px-6 font-sans text-[15px] font-semibold text-ink shadow-[0_8px_18px_rgba(20,28,23,0.3)]"
            >
              <Search size={16} aria-hidden />
              Deal Case 01
            </Link>
          </div>
        </section>
      ) : (
        <>
          <PokerTable podium={podium} stats={stats} youId={youId} />
          <TournamentRegister ranked={ranked} youId={youId} />
        </>
      )}

      <footer className="mt-8 flex flex-col-reverse gap-4 border-t border-cream/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/table"
          className="inline-flex min-h-[44px] items-center gap-2 font-sans text-[15px] font-semibold text-cream underline decoration-cream/35 underline-offset-4"
        >
          <ArrowLeft size={17} aria-hidden />
          Back to the table
        </Link>
        <div className="flex items-center gap-2 text-[12px] text-cream/55">
          <ShieldCheck size={16} className="text-gold" aria-hidden />
          <p>Scores are verified server-side.</p>
        </div>
      </footer>
    </main>
  );
}
