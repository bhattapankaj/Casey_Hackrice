"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Search, Shuffle } from "lucide-react";
import {
  isLegacySleuthNickname,
  randomSherlockCodename,
  suggestBoardNickname,
  type SherlockCodename,
} from "@/lib/board/identity";
import { sanitizeNickname } from "@/lib/board/submission";
import { normalizePlayerName, PLAYER_NAME_MAX_LENGTH } from "@/lib/player-profile";

type PlayerNameFormProps = {
  initialName?: string;
  initialNickname?: string;
  buttonLabel: string;
  onSave: (name: string, nickname: string) => void;
};

export function PlayerNameForm({
  initialName = "",
  initialNickname = "",
  buttonLabel,
  onSave,
}: PlayerNameFormProps) {
  const [value, setValue] = useState(initialName);
  const [nickname, setNickname] = useState(initialNickname);
  const [nicknameEdited, setNicknameEdited] = useState(Boolean(initialNickname));
  const [error, setError] = useState("");
  const codenameRef = useRef<SherlockCodename | null>(null);
  const normalized = normalizePlayerName(value);
  const cleanNickname = sanitizeNickname(nickname);
  const nicknameValid = Boolean(cleanNickname && cleanNickname === nickname.trim());
  const mark = normalized?.charAt(0) ?? "?";

  useEffect(() => {
    if (initialName) {
      setValue((current) => current || initialName);
      setNickname((current) => {
        if (current) return current;
        codenameRef.current ??= randomSherlockCodename();
        return suggestBoardNickname(initialName, codenameRef.current);
      });
    }
  }, [initialName]);

  useEffect(() => {
    if (initialNickname) {
      if (initialName && isLegacySleuthNickname(initialNickname)) {
        codenameRef.current ??= randomSherlockCodename();
        setNickname(suggestBoardNickname(initialName, codenameRef.current));
        setNicknameEdited(false);
      } else {
        setNickname(initialNickname);
        setNicknameEdited(true);
      }
    }
  }, [initialName, initialNickname]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalized) {
      setError("Enter a valid name using letters, spaces, apostrophes, or hyphens.");
      return;
    }
    if (!cleanNickname || !nicknameValid) {
      setError("Enter a leaderboard nickname using letters, numbers, spaces, hyphens, or underscores.");
      return;
    }
    setError("");
    onSave(normalized, cleanNickname);
  }

  function dealAnotherAlias() {
    const codename = randomSherlockCodename(
      Math.random,
      codenameRef.current ?? undefined,
    );
    codenameRef.current = codename;
    setNickname(suggestBoardNickname(value, codename));
    setNicknameEdited(false);
    setError("");
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="surface-cream relative mt-7 max-w-[28rem] overflow-hidden rounded-[14px] bg-cream p-5 text-ink shadow-[0_3px_14px_rgba(20,32,24,0.28)] sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[7px] rounded-[8px] border-[1.5px] border-gold"
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-11 items-center justify-center rounded-full bg-felt-deep font-serif text-[20px] font-semibold text-cream"
          >
            {mark}
          </span>
          <div>
            <p className="font-label text-[11px] tracking-[0.14em] text-ink/50">
              TABLE NAMEPLATE
            </p>
            <p className="font-serif text-[22px] leading-tight font-semibold">
              Who is sitting here?
            </p>
          </div>
        </div>

        <label htmlFor="player-name" className="mt-5 block font-label text-[11px] tracking-[0.12em] text-ink/50">
          Your name
        </label>
        <input
          id="player-name"
          name="playerName"
          value={value}
          onChange={(event) => {
            const nextName = event.target.value;
            setValue(nextName);
            if (!nicknameEdited) {
              codenameRef.current ??= randomSherlockCodename();
              setNickname(
                nextName.trim()
                  ? suggestBoardNickname(nextName, codenameRef.current)
                  : "",
              );
            }
            setError("");
          }}
          required
          maxLength={PLAYER_NAME_MAX_LENGTH}
          autoComplete="off"
          aria-describedby={`player-name-help${error ? " player-name-error" : ""}`}
          aria-invalid={Boolean(error)}
          className="mt-2 w-full border-0 border-b border-ink/25 bg-transparent px-0 py-2 font-serif text-[26px] leading-tight text-ink placeholder:text-ink/30"
          placeholder="Write it here"
        />
        <p id="player-name-help" className="mt-2 text-[13px] leading-relaxed text-ink/55">
          Kept in this browser. Never sent to the caller.
        </p>

        <div className="mt-4 border-t border-ink/10 pt-4">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="board-nickname"
              className="font-label text-[11px] tracking-[0.12em] text-ink/50"
            >
              Leaderboard nickname
            </label>
            <span className="inline-flex items-center gap-1 font-label text-[9px] tracking-[0.1em] text-felt-deep uppercase">
              <Search size={11} aria-hidden />
              Required
            </span>
          </div>
          <input
            id="board-nickname"
            name="boardNickname"
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value);
              setNicknameEdited(true);
              setError("");
            }}
            required
            maxLength={20}
            autoComplete="off"
            aria-describedby="board-nickname-help"
            aria-invalid={!nicknameValid && nickname.length > 0}
            className="mt-2 w-full border-0 border-b border-ink/25 bg-transparent px-0 py-2 font-serif text-[21px] leading-tight text-ink placeholder:text-ink/30"
            placeholder="Your detective alias"
          />
          <p id="board-nickname-help" className="mt-2 text-[12px] leading-relaxed text-ink/55">
            We deal a Sherlock-style codename and 221B marker. Edit it if you like. This
            is the name other players will see on the shared board.
          </p>
          <button
            type="button"
            onClick={dealAnotherAlias}
            disabled={!normalized}
            className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 text-[12px] font-semibold text-felt-deep underline decoration-felt-deep/30 underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Shuffle size={13} strokeWidth={2} aria-hidden />
            Deal another alias
          </button>
        </div>

        <button
          type="submit"
          disabled={!normalized || !nicknameValid}
          className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-ink px-6 font-sans text-[16px] font-semibold text-cream transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {buttonLabel}
          <ArrowRight size={19} strokeWidth={2} aria-hidden />
        </button>

        {error ? (
          <p id="player-name-error" role="alert" className="mt-3 text-[13px] text-red">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
