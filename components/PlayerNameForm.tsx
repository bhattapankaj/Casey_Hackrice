"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { normalizePlayerName, PLAYER_NAME_MAX_LENGTH } from "@/lib/player-profile";

type PlayerNameFormProps = {
  initialName?: string;
  buttonLabel: string;
  onSave: (name: string) => void;
};

export function PlayerNameForm({
  initialName = "",
  buttonLabel,
  onSave,
}: PlayerNameFormProps) {
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState("");
  const normalized = normalizePlayerName(value);
  const mark = normalized?.charAt(0) ?? "?";

  useEffect(() => {
    if (initialName) {
      setValue((current) => current || initialName);
    }
  }, [initialName]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalized) {
      setError("Enter a valid name using letters, spaces, apostrophes, or hyphens.");
      return;
    }
    setError("");
    onSave(normalized);
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
            setValue(event.target.value);
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

        <button
          type="submit"
          disabled={!normalized}
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
