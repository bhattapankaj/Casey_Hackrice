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
    <form onSubmit={submit} className="mt-6 max-w-[27rem]" noValidate>
      <label htmlFor="player-name" className="font-label text-[12px] tracking-[0.08em] text-cream/75">
        Your name
      </label>
      <p id="player-name-help" className="mt-1 text-[13px] leading-relaxed text-cream/65">
        This name stays in your browser and is not sent to the caller.
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
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
          className="surface-cream min-h-[52px] min-w-0 flex-1 rounded-[12px] border border-cream/30 bg-cream px-4 text-[17px] text-ink placeholder:text-ink/45"
          placeholder="Enter your name"
        />
        <button
          type="submit"
          disabled={!normalized}
          className="surface-cream inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[12px] bg-cream px-6 font-sans text-[16px] font-semibold text-ink transition-shadow duration-150 hover:shadow-[0_6px_16px_rgba(20,40,30,0.45)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {buttonLabel}
          <ArrowRight size={19} strokeWidth={2} aria-hidden />
        </button>
      </div>
      {error ? (
        <p id="player-name-error" role="alert" className="mt-2 text-[13px] text-cream">
          {error}
        </p>
      ) : null}
    </form>
  );
}
