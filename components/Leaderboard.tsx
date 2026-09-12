"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { postScore, readBoard, type BoardEntry } from "@/lib/board";
import {
  CASES,
  CASE_ORDER,
  CASE_TOTAL,
  TRUTH_LABEL,
  VERDICT_LABEL,
} from "@/lib/cases";
import {
  completedCount,
  defaultSession,
  markPosted,
  readSession,
  resetRun,
  saveNickname,
  type GameSession,
} from "@/lib/session";

type Status = "loading" | "ready" | "error";
type PostState = "idle" | "submitted" | "duplicate" | "invalid";

export function Leaderboard() {
  const [status, setStatus] = useState<Status>("loading");
  const [post, setPost] = useState<PostState>("idle");
  const [entries, setEntries] = useState<BoardEntry[]>([]);
  const [session, setSession] = useState<GameSession>(defaultSession());
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    try {
      const current = readSession();
      setSession(current);
      setNickname(current.nickname);
      setEntries(readBoard());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nickname.trim();
    if (!name) {
      setPost("invalid");
      return;
    }
    if (session.postedScore === session.score && session.nickname === name) {
      setPost("duplicate");
      return;
    }
    saveNickname(name);
    markPosted(session.score);
    setEntries(postScore(name, session.score));
    setSession(readSession());
    setPost("submitted");
  }

  const done = completedCount(session);
  const runFinished = done === CASE_TOTAL;

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-5">
        <p className="text-[16px] text-cream/80" role="status">
          Loading your run.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-5">
        <h1 className="font-serif text-[30px] font-semibold text-cream">
          The board could not be read
        </h1>
        <p className="mt-3 max-w-[52ch] text-[16px] text-cream/90">
          Your browser blocked local storage, so scores cannot be kept on this
          device. You can still play every case.
        </p>
        <Link
          href="/play/case-01"
          className="surface-cream mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-cream px-6 font-sans text-[16px] font-semibold text-ink"
        >
          Deal case one
          <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col px-4 py-8 sm:px-5">
      <h1 className="font-serif text-[30px] leading-tight font-semibold text-cream sm:text-[37px]">
        Your run
      </h1>
      <p className="mt-2 text-[16px] text-cream/85">
        {done} of {CASE_TOTAL} cases complete.
      </p>

      {done === 0 ? (
        <div className="mt-6 rounded-[12px] border border-cream/20 p-4">
          <p className="max-w-[52ch] text-[16px] text-cream/85">
            You have not finished a case yet. Play one and your result appears
            here.
          </p>
          <Link
            href="/play/case-01"
            className="surface-cream mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-cream px-6 font-sans text-[16px] font-semibold text-ink"
          >
            Deal case one
            <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="mt-5">
          {CASE_ORDER.map((id) => {
            const result = session.results[id];
            const gameCase = CASES[id];
            return (
              <li
                key={id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-cream/15 py-3"
              >
                <span className="text-[16px] font-semibold text-cream">
                  {gameCase.title}
                </span>
                {result ? (
                  <>
                    <span className="flex items-center gap-2 text-[16px] text-cream/85">
                      {result.correct ? (
                        <Check size={18} strokeWidth={2} aria-hidden className="text-cream" />
                      ) : (
                        <X size={18} strokeWidth={2} aria-hidden className="text-red" />
                      )}
                      You said {VERDICT_LABEL[result.verdict]}, actual{" "}
                      {TRUTH_LABEL[result.truth]}
                    </span>
                    <span className="font-serif text-[19px] font-semibold text-cream">
                      {result.delta > 0 ? `+${result.delta}` : result.delta}
                    </span>
                  </>
                ) : (
                  <span className="text-[16px] text-cream/60">Not played</span>
                )}
              </li>
            );
          })}
          <li className="flex items-baseline justify-between gap-4 py-3">
            <span className="text-[16px] font-semibold text-cream">Run total</span>
            <span className="font-serif text-[37px] leading-none font-semibold text-cream">
              {session.score}
            </span>
          </li>
        </ul>
      )}

      {runFinished ? (
        <div className="mt-4 rounded-[12px] border border-cream/20 p-4">
          <h2 className="font-label text-[12px] tracking-[0.08em] text-cream/70">
            One habit to practise
          </h2>
          <p className="mt-2 max-w-[52ch] text-[16px] leading-relaxed text-cream/90">
            {CASES["case-01"].debrief.habit}
          </p>
        </div>
      ) : null}

      <h2 className="mt-12 font-serif text-[30px] leading-tight font-semibold text-cream">
        The board
      </h2>
      <p className="mt-2 max-w-[52ch] text-[16px] text-cream/85">
        On this device. Scores are kept in this browser only. The sample rows
        ship with the demo and are not other players.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="font-label text-[12px] tracking-[0.08em] text-cream/80">
            Nickname (optional)
          </span>
          <input
            name="nickname"
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value);
              setPost("idle");
            }}
            autoComplete="nickname"
            aria-describedby="post-status"
            className="surface-cream h-12 rounded-[12px] bg-cream px-4 font-sans text-[16px] text-ink"
          />
        </label>
        <button
          type="submit"
          className="surface-cream inline-flex h-12 min-h-[44px] items-center justify-center rounded-[12px] bg-cream px-6 font-sans text-[16px] font-semibold text-ink"
        >
          Post my score
        </button>
      </form>

      <p id="post-status" role="status" className="mt-3 min-h-[1.5rem] text-[16px] text-cream/90">
        {post === "invalid" ? "Enter a nickname to post your score." : null}
        {post === "submitted" ? "Your score is on the board for this device." : null}
        {post === "duplicate"
          ? "This score is already posted. Finish another case to post a new one."
          : null}
      </p>

      <table className="mt-6 w-full border-collapse text-left">
        <caption className="sr-only">
          Scores stored on this device, highest first
        </caption>
        <thead>
          <tr className="border-b border-cream/25">
            <th scope="col" className="py-2 pr-3 font-label text-[12px] tracking-[0.08em] text-cream/70">
              Rank
            </th>
            <th scope="col" className="py-2 pr-3 font-label text-[12px] tracking-[0.08em] text-cream/70">
              Nickname
            </th>
            <th scope="col" className="py-2 text-right font-label text-[12px] tracking-[0.08em] text-cream/70">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 text-[16px] text-cream/80">
                No scores on this device yet.
              </td>
            </tr>
          ) : (
            entries.map((entry, index) => (
              <tr
                key={`${entry.name}-${entry.sample ? "s" : "y"}`}
                className={`border-b border-cream/12 ${
                  entry.you ? "bg-cream/10" : ""
                }`}
              >
                <td className="py-3 pr-3 font-serif text-[19px] font-semibold text-cream">
                  {index + 1}
                </td>
                <td className="py-3 pr-3 text-[16px] text-cream">
                  {entry.name}
                  {entry.you ? (
                    <span className="ml-2 rounded-[4px] border border-cream/40 px-1.5 py-0.5 font-label text-[10px] tracking-[0.08em] text-cream">
                      You
                    </span>
                  ) : null}
                  {entry.sample ? (
                    <span className="ml-2 font-label text-[10px] tracking-[0.08em] text-cream/55">
                      Sample
                    </span>
                  ) : null}
                </td>
                <td className="py-3 text-right font-serif text-[19px] font-semibold text-cream">
                  {entry.score}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Link
          href="/"
          className="min-h-[44px] font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
        >
          Back to the table
        </Link>
        <button
          type="button"
          onClick={() => {
            resetRun();
            setSession(readSession());
            setNickname("");
            setPost("idle");
          }}
          className="min-h-[44px] font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
        >
          Start a new run
        </button>
      </div>
    </div>
  );
}
