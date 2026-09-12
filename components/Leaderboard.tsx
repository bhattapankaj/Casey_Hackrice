"use client";

import { FormEvent, useEffect, useState } from "react";
import { postScore, readBoard, type BoardEntry } from "@/lib/board";
import { readSession, saveNickname } from "@/lib/session";

export function Leaderboard() {
  const [entries, setEntries] = useState<BoardEntry[]>([]);
  const [nickname, setNickname] = useState("");
  const [score, setScore] = useState(240);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const session = readSession();
    setNickname(session.nickname);
    setScore(session.score);
    setEntries(readBoard());
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nickname.trim();
    if (!name) {
      setMessage("Enter a nickname to post your score.");
      return;
    }
    saveNickname(name);
    setEntries(postScore(name, score));
    setMessage("Your score is on the board.");
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-8">
      <h1 className="font-serif text-[24px] font-semibold text-cream">
        The board
      </h1>
      <p className="mt-3 max-w-[36rem] text-[16px] text-cream/90">
        Post a nickname after you play. Scores stay on this browser.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="font-label text-[12px] tracking-[0.08em] text-cream/80">
            Nickname
          </span>
          <input
            name="nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            autoComplete="nickname"
            className="h-12 rounded-[12px] bg-cream px-4 font-sans text-[15px] text-ink"
          />
        </label>
        <button
          type="submit"
          className="h-12 rounded-[12px] bg-cream px-5 font-sans text-[15px] font-semibold text-ink transition-transform duration-150 hover:-translate-y-px"
        >
          Post my score
        </button>
      </form>
      {message ? (
        <p className="mt-3 text-[15px] text-cream/90" role="status">
          {message}
        </p>
      ) : null}

      <ol className="mt-10">
        {entries.map((entry, index) => (
          <li
            key={entry.name}
            className="flex items-baseline justify-between gap-4 border-b border-cream/15 py-3"
          >
            <span className="font-sans text-[15px] text-cream">
              {index + 1}. {entry.name}
            </span>
            <span className="shrink-0 font-serif text-[24px] font-semibold text-gold">
              {entry.score}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
