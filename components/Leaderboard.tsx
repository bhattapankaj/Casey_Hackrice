"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  FileCheck2,
  Fingerprint,
  Search,
  ShieldCheck,
  Trophy,
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

function hasMasterBadge(row: BoardRow): boolean {
  return row.casesCleared >= ALL_CASES;
}

function SuitMarks({ ink = false }: { ink?: boolean }) {
  return (
    <div
      aria-hidden
      className={`flex items-center gap-2 font-serif text-[15px] ${ink ? "text-ink/55" : "text-cream/45"}`}
    >
      <span>♠</span>
      <span className="text-red">♥</span>
      <span>♣</span>
      <span className="text-red">♦</span>
    </div>
  );
}

function MasterBadge({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center drop-shadow-[0_3px_7px_rgba(37,33,33,0.24)]"
      title={`Master of Deduction: cleared all ${ALL_CASES} cases`}
    >
      <Image
        src="/casey-deduction-badge.svg"
        alt={`Master of Deduction badge, all ${ALL_CASES} cases cleared`}
        width={size}
        height={size}
      />
    </span>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-[16px] border border-cream/15 bg-felt-deep/65 p-4 shadow-[0_10px_26px_rgba(24,43,33,0.2)]">
      <div className="absolute top-0 right-0 h-14 w-14 translate-x-5 -translate-y-5 rounded-full border border-gold/20 transition-transform duration-300 group-hover:scale-125" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-[10px] tracking-[0.12em] text-cream/60 uppercase">
            {label}
          </p>
          <p className="mt-1 font-serif text-[29px] leading-none font-semibold text-cream">
            {value}
          </p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/45 bg-gold/10 text-gold">
          <Icon size={17} strokeWidth={1.8} aria-hidden />
        </span>
      </div>
      <p className="mt-3 border-t border-cream/10 pt-2 font-label text-[9px] tracking-[0.08em] text-cream/45 uppercase">
        {note}
      </p>
    </div>
  );
}

function Row({
  rank,
  row,
  current,
}: {
  rank: number;
  row: BoardRow;
  current: boolean;
}) {
  return (
    <tr
      className={`group border-b border-cream-dim/15 transition-colors last:border-0 hover:bg-cream/[0.045] ${
        current ? "bg-gold/[0.075] shadow-[inset_3px_0_0_#CF9C2D]" : ""
      }`}
    >
      <td className="py-3.5 pr-4 pl-1">
        <span
          className={`grid h-8 w-8 place-items-center rounded-full border font-serif text-[15px] font-semibold ${
            rank <= 3
              ? "border-gold/60 bg-gold/10 text-gold"
              : "border-cream/15 text-cream/65"
          }`}
        >
          {rank}
        </span>
      </td>
      <td className="py-3.5 pr-6 text-[15px] text-cream">
        <div className="flex min-w-[190px] items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cream/15 bg-felt-deep text-cream/55">
            <Fingerprint size={17} strokeWidth={1.65} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-serif text-[17px] font-semibold">{row.nickname}</span>
              {hasMasterBadge(row) ? <MasterBadge size={27} /> : null}
              {current ? (
                <span className="rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 font-label text-[9px] tracking-[0.12em] text-gold uppercase">
                  You
                </span>
              ) : null}
            </div>
            <span className="mt-0.5 block font-label text-[10px] tracking-[0.06em] text-gold">
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
      <td className="py-3.5 pr-6 text-[14px] text-cream/75">
        <span className="rounded-full border border-cream/15 bg-cream/[0.04] px-2.5 py-1 whitespace-nowrap">
          {row.bestHand ?? "High card"}
        </span>
      </td>
      <td className="py-3.5 pr-6 font-serif text-[18px] font-semibold text-gold">
        {row.chips}
      </td>
      <td className="py-3.5 pr-1 text-right font-serif text-[20px] font-semibold text-cream">
        {row.score.toLocaleString()}
      </td>
    </tr>
  );
}

function MobileRow({
  rank,
  row,
  current,
}: {
  rank: number;
  row: BoardRow;
  current: boolean;
}) {
  return (
    <article
      data-mobile-investigator={row.username}
      aria-label={`${row.nickname}, rank ${rank}`}
      className={`rounded-[14px] border p-4 ${
        current
          ? "border-gold/55 bg-gold/[0.08] shadow-[inset_3px_0_0_#CF9C2D]"
          : "border-cream/10 bg-felt-deep/35"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border font-serif text-[15px] font-semibold ${
            rank <= 3
              ? "border-gold/60 bg-gold/10 text-gold"
              : "border-cream/15 text-cream/65"
          }`}
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-serif text-[18px] font-semibold text-cream">
              {row.nickname}
            </h3>
            {hasMasterBadge(row) ? <MasterBadge size={26} /> : null}
            {current ? (
              <span className="rounded-full border border-gold/50 px-2 py-0.5 font-label text-[8px] tracking-[0.12em] text-gold uppercase">
                You
              </span>
            ) : null}
          </div>
          <p className="font-label text-[10px] tracking-[0.05em] text-gold">
            @{row.username}
          </p>
        </div>
        <div className="text-right">
          <p className="font-label text-[8px] tracking-[0.12em] text-cream/40 uppercase">
            Score
          </p>
          <p className="font-serif text-[21px] font-semibold text-cream">
            {row.score.toLocaleString()}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-cream/10 pt-3">
        <div>
          <dt className="font-label text-[8px] tracking-[0.1em] text-cream/40 uppercase">
            Cases
          </dt>
          <dd className="mt-1 font-serif text-[16px] font-semibold text-cream">
            {row.casesCleared}<span className="text-cream/35"> / {ALL_CASES}</span>
          </dd>
        </div>
        <div>
          <dt className="font-label text-[8px] tracking-[0.1em] text-cream/40 uppercase">
            Best hand
          </dt>
          <dd className="mt-1 truncate text-[12px] font-semibold text-cream/80">
            {row.bestHand ?? "High card"}
          </dd>
        </div>
        <div>
          <dt className="font-label text-[8px] tracking-[0.1em] text-cream/40 uppercase">
            Chips
          </dt>
          <dd className="mt-1 font-serif text-[17px] font-semibold text-gold">{row.chips}</dd>
        </div>
      </dl>
    </article>
  );
}

function LedgerHeader() {
  return (
    <header className="relative overflow-hidden rounded-[24px] border border-cream/20 bg-felt-deep/75 shadow-[0_22px_55px_rgba(20,40,30,0.35)]">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold" />
      <div aria-hidden className="absolute -top-16 -right-14 h-56 w-56 rounded-full border border-cream/10" />
      <div aria-hidden className="absolute top-1/2 -right-3 h-36 w-36 -translate-y-1/2 rounded-full border border-dashed border-gold/20" />
      <div aria-hidden className="absolute bottom-0 left-[9%] h-px w-[52%] bg-cream/10" />

      <div className="relative grid gap-7 px-5 py-7 sm:px-8 sm:py-9 md:grid-cols-[1fr_220px] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-label text-[10px] tracking-[0.2em] text-gold uppercase">
              Casey casebook · File 221B
            </p>
            <SuitMarks />
          </div>
          <h1 className="mt-3 max-w-[680px] font-serif text-[38px] leading-[0.98] font-semibold tracking-[-0.025em] text-cream sm:text-[54px]">
            The Deduction Ledger
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-cream/75 sm:text-[16px]">
            The game is afoot. Every score is reconstructed from verdicts and pinned
            evidence; the browser never chooses the number.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-cream/15 px-3 py-1 font-label text-[9px] tracking-[0.12em] text-cream/60 uppercase">
              Independent sources
            </span>
            <span className="rounded-full border border-cream/15 px-3 py-1 font-label text-[9px] tracking-[0.12em] text-cream/60 uppercase">
              Server verified
            </span>
            <span className="rounded-full border border-cream/15 px-3 py-1 font-label text-[9px] tracking-[0.12em] text-cream/60 uppercase">
              No speed scoring
            </span>
          </div>
        </div>

        <div className="hidden justify-self-end md:block" aria-hidden>
          <div className="relative grid h-[172px] w-[172px] place-items-center rounded-full border border-gold/50 bg-felt shadow-[inset_0_0_0_9px_rgba(245,239,224,0.04)]">
            <div className="absolute inset-4 rounded-full border border-dashed border-cream/25" />
            <Search size={60} strokeWidth={1.15} className="-translate-x-1 -translate-y-1 text-cream" />
            <span className="absolute right-1 bottom-5 grid h-11 w-11 place-items-center rounded-full border-2 border-felt-deep bg-gold font-serif text-[20px] font-bold text-ink">
              K
            </span>
          </div>
          <p className="mt-3 text-center font-label text-[9px] tracking-[0.2em] text-cream/45 uppercase">
            Observe · Verify · Deduce
          </p>
        </div>
      </div>
    </header>
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
    <main className="mx-auto flex w-full max-w-[1080px] flex-col px-4 py-6 sm:px-6 sm:py-9">
      <LedgerHeader />

      {localOnly ? (
        <div className="mt-4 flex items-start gap-3 rounded-[12px] border border-gold/30 bg-gold/[0.07] px-4 py-3 text-[13px] text-cream/70">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-gold" aria-hidden />
          <p>Showing your local scores. The shared board is unavailable.</p>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-10 flex items-center justify-center gap-3 rounded-[18px] border border-cream/10 bg-felt-deep/40 py-14 text-cream/65">
          <Search size={22} className="motion-safe:animate-pulse" aria-hidden />
          <p className="font-serif text-[18px]">Opening the case ledger…</p>
        </div>
      ) : !hasScores ? (
        <section className="relative mx-auto mt-10 w-full max-w-[680px] overflow-hidden rounded-[20px] border border-gold/55 bg-cream px-6 py-12 text-center text-ink shadow-[0_18px_45px_rgba(24,43,33,0.3)] sm:px-12">
          <div aria-hidden className="absolute top-4 right-5 rotate-6 rounded-[4px] border-2 border-red/45 px-3 py-1 font-label text-[10px] tracking-[0.18em] text-red/70 uppercase">
            Unsolved
          </div>
          <SuitMarks ink />
          <span className="mx-auto mt-5 grid h-16 w-16 place-items-center rounded-full border border-gold bg-felt-deep text-cream shadow-[inset_0_0_0_5px_rgba(207,156,45,0.15)]">
            <Search size={30} strokeWidth={1.5} aria-hidden />
          </span>
          <p className="mt-5 font-label text-[10px] tracking-[0.2em] text-ink/45 uppercase">
            Empty evidence register
          </p>
          <h2 className="mt-1 font-serif text-[29px] font-semibold">No hands played yet</h2>
          <p className="mx-auto mt-2 max-w-[36ch] text-[15px] leading-relaxed text-ink/65">
            Finish a case and the first row is yours
          </p>
          <Link
            href="/play/case-01"
            className="mt-7 inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-felt-deep px-6 font-sans text-[15px] font-semibold text-cream shadow-[0_7px_16px_rgba(37,33,33,0.18)]"
          >
            <Search size={16} aria-hidden />
            Deal Case 01
          </Link>
        </section>
      ) : (
        <>
          <section aria-label="Case ledger summary" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat
              icon={UsersRound}
              label="Detectives tonight"
              value={String(stats.playersTonight)}
              note="Active case files"
            />
            <Stat
              icon={FileCheck2}
              label="Cases played"
              value={String(stats.casesPlayed)}
              note="Evidence reviewed"
            />
            <Stat
              icon={ShieldCheck}
              label="Fooled by case 01"
              value={stats.case01WrongPercent === null ? "n/a" : `${stats.case01WrongPercent}%`}
              note="Anonymous aggregate"
            />
          </section>

          {podium.length > 0 ? (
            <section aria-labelledby="podium-title" className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-cream/15 pb-3">
                <div>
                  <p className="font-label text-[9px] tracking-[0.18em] text-gold uppercase">
                    The sharpest minds at the table
                  </p>
                  <h2 id="podium-title" className="mt-1 font-serif text-[26px] font-semibold text-cream">
                    Leading investigators
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-cream/60">
                  <MasterBadge size={30} />
                  <span>Master of Deduction · all cases cleared</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {podium.map(({ row, rank }) => {
                  const first = rank === 1;
                  return (
                    <article
                      key={`podium-${row.id}`}
                      className={`relative overflow-hidden rounded-[18px] border p-5 shadow-[0_14px_30px_rgba(21,40,30,0.25)] ${
                        first
                          ? "surface-cream border-gold bg-cream text-ink"
                          : "border-cream/20 bg-felt-deep/70 text-cream"
                      }`}
                    >
                      <div
                        aria-hidden
                        className={`absolute top-0 right-0 h-20 w-20 translate-x-7 -translate-y-7 rounded-full border ${
                          first ? "border-ink/10" : "border-cream/10"
                        }`}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`grid h-9 w-9 place-items-center rounded-full border font-serif text-[18px] font-bold ${
                              first
                                ? "border-gold bg-gold text-ink"
                                : "border-gold/55 bg-gold/10 text-gold"
                            }`}
                          >
                            {rank}
                          </span>
                          <div>
                            <p
                              className={`font-label text-[9px] tracking-[0.16em] uppercase ${
                                first ? "text-ink/50" : "text-cream/45"
                              }`}
                            >
                              {rank === 1 ? "Lead detective" : `Filed rank ${rank}`}
                            </p>
                            {first ? <SuitMarks ink /> : <SuitMarks />}
                          </div>
                        </div>
                        {first ? <Trophy size={21} className="text-gold" aria-hidden /> : null}
                      </div>

                      <div className="mt-5 flex min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-serif text-[22px] font-semibold">
                            {row.nickname}
                          </h3>
                          <p
                            className={`truncate font-label text-[10px] tracking-[0.05em] ${
                              first ? "text-felt-deep" : "text-gold"
                            }`}
                          >
                            @{row.username}
                          </p>
                        </div>
                        {hasMasterBadge(row) ? <MasterBadge size={46} /> : null}
                      </div>

                      <div
                        className={`mt-5 grid grid-cols-3 gap-2 border-t pt-4 ${
                          first ? "border-ink/10" : "border-cream/10"
                        }`}
                      >
                        <div>
                          <p className="font-label text-[8px] tracking-[0.11em] opacity-50 uppercase">
                            Score
                          </p>
                          <p className="mt-1 font-serif text-[22px] leading-none font-semibold">
                            {row.score.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="font-label text-[8px] tracking-[0.11em] opacity-50 uppercase">
                            Hand
                          </p>
                          <p className="mt-1 truncate text-[12px] font-semibold">
                            {row.bestHand ?? "High card"}
                          </p>
                        </div>
                        <div>
                          <p className="font-label text-[8px] tracking-[0.11em] opacity-50 uppercase">
                            Chips
                          </p>
                          <p className={`mt-1 font-serif text-[17px] font-semibold ${first ? "text-felt-deep" : "text-gold"}`}>
                            {row.chips}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="all-investigators-title" className="mt-10">
            <div className="rounded-t-[18px] border border-b-0 border-cream/15 bg-felt-deep/75 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                    <Fingerprint size={19} strokeWidth={1.6} aria-hidden />
                  </span>
                  <div>
                    <p className="font-label text-[9px] tracking-[0.18em] text-gold uppercase">
                      Scotland Yard-style case register
                    </p>
                    <h2
                      id="all-investigators-title"
                      className="font-serif text-[23px] font-semibold text-cream"
                    >
                      All investigators
                    </h2>
                  </div>
                </div>
                <div className="rounded-full border border-cream/15 px-3 py-1.5 font-label text-[10px] tracking-[0.12em] text-cream/60 uppercase">
                  <span>
                    {ranked.length} {ranked.length === 1 ? "player" : "players"}
                  </span>{" "}
                  <span className="text-cream/35">on file</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2 rounded-b-[18px] border border-cream/15 bg-felt-deep/35 p-3 sm:hidden">
              {ranked.map((entry) => (
                <MobileRow
                  key={`mobile-${entry.row.id}`}
                  rank={entry.rank}
                  row={entry.row}
                  current={entry.row.id === youId || Boolean(entry.row.you)}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-b-[18px] border border-cream/15 bg-felt-deep/35 px-5 sm:block">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <caption className="sr-only">All player scores</caption>
                <thead>
                  <tr className="border-b border-gold/25">
                    <th scope="col" className="py-3 pr-4 pl-1 font-label text-[9px] tracking-[0.14em] text-cream/50 uppercase">
                      Rank
                    </th>
                    <th scope="col" className="py-3 pr-6 font-label text-[9px] tracking-[0.14em] text-cream/50 uppercase">
                      Investigator / ID
                    </th>
                    <th scope="col" className="py-3 pr-6 font-label text-[9px] tracking-[0.14em] text-cream/50 uppercase">
                      Cases
                    </th>
                    <th scope="col" className="py-3 pr-6 font-label text-[9px] tracking-[0.14em] text-cream/50 uppercase">
                      Best hand
                    </th>
                    <th scope="col" className="py-3 pr-6 font-label text-[9px] tracking-[0.14em] text-cream/50 uppercase">
                      Chips
                    </th>
                    <th scope="col" className="py-3 pr-1 text-right font-label text-[9px] tracking-[0.14em] text-cream/50 uppercase">
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
