"use client";

import { useEffect, useState, type FormEvent } from "react";
import { persistNickname, readStoredProgress } from "@/lib/progress";
import { postCurrentBoard } from "@/lib/board/client";
import { sanitizeNickname } from "@/lib/board/submission";

export function NicknamePrompt() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const progress = readStoredProgress();
    setValue(progress.nickname ?? "");
    setOpen(!progress.nicknameAsked);
    setReady(true);
  }, []);

  if (!ready || !open) {
    return null;
  }

  function skip() {
    persistNickname(null, true);
    setOpen(false);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const clean = sanitizeNickname(value);
    if (!clean) {
      setError("Use letters, numbers, spaces, hyphens, or underscores.");
      return;
    }
    await postCurrentBoard(clean);
    setOpen(false);
  }

  return (
    <form
      onSubmit={save}
      className="surface-cream relative mt-6 max-w-[28rem] overflow-hidden rounded-[14px] bg-cream p-5 text-ink"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[7px] rounded-[8px] border-[1.5px] border-gold"
      />
      <div className="relative">
        <p className="font-label text-[11px] tracking-[0.14em] text-ink/50">NICKNAME</p>
        <p className="mt-1 font-serif text-[20px] leading-tight font-semibold">
          Put a name on the board
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/65">
          Optional. Skip keeps this run local only.
        </p>
        <label htmlFor="board-nickname" className="mt-4 block font-label text-[11px] tracking-[0.12em] text-ink/50">
          Nickname
        </label>
        <input
          id="board-nickname"
          value={value}
          maxLength={20}
          autoComplete="off"
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          className="mt-2 w-full border-0 border-b border-ink/25 bg-transparent px-0 py-2 font-serif text-[22px] text-ink"
        />
        {error ? (
          <p role="alert" className="mt-2 text-[13px] text-red">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="inline-flex h-[40px] items-center rounded-full bg-ink px-5 font-sans text-[14px] font-semibold text-cream"
          >
            Save nickname
          </button>
          <button
            type="button"
            onClick={skip}
            className="min-h-[40px] font-sans text-[14px] font-semibold text-ink underline decoration-ink/35 underline-offset-4"
          >
            Skip
          </button>
        </div>
      </div>
    </form>
  );
}
