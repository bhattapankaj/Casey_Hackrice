"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchSharedBoard } from "@/lib/board/client";
import { localBoardPayload } from "@/lib/board/local";
import type { BoardRow, BoardStats } from "@/lib/board/types";
import { readStoredProgress } from "@/lib/progress";

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
    <div className={wide ? "min-w-0 sm:col-span-2" : "min-w-0"}>
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
        {row.nickname}
        {current ? (
          <span className="ml-2 font-label text-[10px] tracking-[0.08em] text-cream/55">You</span>
        ) : null}
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

  useEffect(() => {
    const progress = readStoredProgress();
    const local = localBoardPayload(progress);

    void fetchSharedBoard().then((shared) => {
      if (shared.unavailable) {
        setLocalOnly(true);
        setEntries(local.entries);
        setStats(local.stats);
        setYouId(local.entries[0]?.id ?? null);
        return;
      }
      const you = local.entries[0];
      const merged = [...shared.entries];
      if (you && !merged.some((row) => row.nickname === you.nickname && row.score === you.score)) {
        merged.push(you);
      }
      merged.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
      setEntries(merged);
      setStats(shared.stats);
      setYouId(you?.id ?? null);
      setLocalOnly(false);
    });
  }, []);

  const ranked = entries.map((row, index) => ({ row, rank: index + 1 }));
  const top = ranked.slice(0, 25);
  const you = ranked.find((entry) => entry.row.id === youId || entry.row.you);
  const youOutside = Boolean(you && you.rank > 25);

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col px-4 py-8 sm:px-5">
      <h1 className="font-serif text-[30px] leading-tight font-semibold text-cream sm:text-[37px]">
        The board
      </h1>
      <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-cream/80">
        Scores are recomputed on the server from verdicts and pins. The browser never
        chooses the number.
      </p>

      {localOnly ? (
        <p className="mt-4 text-[13px] text-cream/65">
          Showing your local scores. The shared board is unavailable.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-6 border-y border-cream-dim/20 py-4 sm:grid-cols-4">
        <Stat label="Players tonight" value={String(stats.playersTonight)} />
        <Stat label="Cases played" value={String(stats.casesPlayed)} />
        <Stat
          wide
          label="Got case 01 wrong"
          value={stats.case01WrongPercent === null ? "n/a" : `${stats.case01WrongPercent}%`}
        />
      </div>

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
          {top.length === 0 ? (
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
          href="/"
          className="min-h-[44px] font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
        >
          Back to the table
        </Link>
      </div>
    </div>
  );
}
