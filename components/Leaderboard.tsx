"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  fetchSharedBoard,
  getOrCreateBoardSubmissionId,
  postCurrentBoard,
} from "@/lib/board/client";
import { localBoardPayload } from "@/lib/board/local";
import type { BoardRow, BoardStats } from "@/lib/board/types";
import { CASE_ORDER } from "@/lib/cases/registry";
import { readStoredProgress } from "@/lib/progress";

const ALL_CASES = CASE_ORDER.length;

function hasMasterBadge(row: BoardRow): boolean {
  return row.casesCleared >= ALL_CASES;
}

function MasterBadge({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center"
      title={`Master of Deduction — cleared all ${ALL_CASES} cases`}
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
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-[12px] border border-cream/15 bg-felt-deep/45 p-4 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <p className="font-label text-[11px] tracking-[0.08em] text-cream/65 uppercase">{label}</p>
      <p className="mt-1 font-serif text-[24px] leading-none font-semibold text-cream">{value}</p>
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
    <tr className={`border-b border-cream-dim/20 ${current ? "shadow-[inset_2px_0_0_#CF9C2D]" : ""}`}>
      <td className="py-3 pr-4 font-serif text-[19px] font-semibold text-cream">{rank}</td>
      <td className="py-3 pr-4 text-[16px] text-cream">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{row.nickname}</span>
          <span className="font-label text-[11px] tracking-[0.05em] text-gold">
            @{row.username}
          </span>
          {hasMasterBadge(row) ? <MasterBadge size={28} /> : null}
          {current ? (
            <span className="rounded-full border border-cream/25 px-2 py-0.5 font-label text-[9px] tracking-[0.1em] text-cream/70 uppercase">
              You
            </span>
          ) : null}
        </div>
      </td>
      <td className="py-3 pr-4 text-[16px] text-cream/80">{row.casesCleared}</td>
      <td className="py-3 text-right font-serif text-[19px] font-semibold text-cream">{row.score}</td>
    </tr>
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
      merged.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
      setEntries(merged);
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
  const top = ranked.slice(0, 25);
  const you = ranked.find((entry) => entry.row.id === youId || entry.row.you);
  const youOutside = Boolean(you && you.rank > 25);
  const podium = ranked.slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col px-4 py-8 sm:px-5">
      <p className="font-label text-[11px] tracking-[0.16em] text-gold uppercase">
        Casey casebook
      </p>
      <h1 className="mt-1 font-serif text-[34px] leading-tight font-semibold text-cream sm:text-[43px]">
        The Deduction Ledger
      </h1>
      <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-cream/80">
        The game is afoot. Every score is reconstructed from verdicts and pinned
        evidence; the browser never chooses the number.
      </p>

      {localOnly ? (
        <p className="mt-4 text-[13px] text-cream/65">
          Showing your local scores. The shared board is unavailable.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Detectives tonight" value={String(stats.playersTonight)} />
        <Stat label="Cases played" value={String(stats.casesPlayed)} />
        <Stat
          wide
          label="Got case 01 wrong"
          value={stats.case01WrongPercent === null ? "n/a" : `${stats.case01WrongPercent}%`}
        />
      </div>

      {podium.length > 0 ? (
        <section aria-labelledby="podium-title" className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 id="podium-title" className="font-serif text-[22px] font-semibold text-cream">
              Leading investigators
            </h2>
            <div className="flex items-center gap-2 text-[12px] text-cream/65">
              <MasterBadge size={27} />
              <span>All cases cleared</span>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {podium.map(({ row, rank }) => (
              <article
                key={`podium-${row.id}`}
                className={`relative overflow-hidden rounded-[14px] border p-4 ${
                  rank === 1
                    ? "border-gold bg-cream text-ink shadow-[0_8px_24px_rgba(20,32,24,0.28)]"
                    : "border-cream/20 bg-felt-deep/55 text-cream"
                }`}
              >
                <p
                  className={`font-label text-[10px] tracking-[0.14em] uppercase ${
                    rank === 1 ? "text-ink/55" : "text-cream/55"
                  }`}
                >
                  Rank {rank}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-[20px] font-semibold">{row.nickname}</p>
                    <p
                      className={`truncate font-label text-[10px] tracking-[0.04em] ${
                        rank === 1 ? "text-felt-deep" : "text-gold"
                      }`}
                    >
                      @{row.username}
                    </p>
                  </div>
                  {hasMasterBadge(row) ? <MasterBadge size={42} /> : null}
                </div>
                <p className="mt-4 font-serif text-[28px] leading-none font-semibold">{row.score}</p>
                <p
                  className={`mt-1 text-[11px] ${
                    rank === 1 ? "text-ink/55" : "text-cream/55"
                  }`}
                >
                  {row.casesCleared} of {ALL_CASES} cases cleared
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <table className="mt-8 w-full border-collapse text-left">
        <caption className="sr-only">Top 25 scores</caption>
        <thead>
          <tr className="border-b border-cream-dim/20">
            <th scope="col" className="py-2 pr-4 font-label text-[11px] tracking-[0.08em] text-cream/65">
              Rank
            </th>
            <th scope="col" className="py-2 pr-4 font-label text-[11px] tracking-[0.08em] text-cream/65">
              Nickname
            </th>
            <th scope="col" className="py-2 pr-4 font-label text-[11px] tracking-[0.08em] text-cream/65">
              Cases cleared
            </th>
            <th scope="col" className="py-2 text-right font-label text-[11px] tracking-[0.08em] text-cream/65">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="py-5 text-[16px] text-cream/70">
                Opening the case ledger…
              </td>
            </tr>
          ) : top.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-5 text-[16px] text-cream/70">
                No scores yet. Finish a case and the row appears here.
              </td>
            </tr>
          ) : (
            top.map((entry) => (
              <Row
                key={entry.row.id}
                rank={entry.rank}
                row={entry.row}
                current={entry.row.id === youId || Boolean(entry.row.you)}
              />
            ))
          )}
        </tbody>
      </table>

      {youOutside && you ? (
        <table className="mt-4 w-full border-collapse text-left">
          <caption className="sr-only">Your rank outside the top 25</caption>
          <tbody>
            <Row rank={you.rank} row={you.row} current />
          </tbody>
        </table>
      ) : null}

      <div className="mt-8">
        <Link
          href="/table"
          className="min-h-[44px] font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
        >
          Back to the table
        </Link>
      </div>
    </div>
  );
}
