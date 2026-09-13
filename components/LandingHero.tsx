"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HowToPlayCards } from "@/components/HowToPlay";
import { PlayerNameForm } from "@/components/PlayerNameForm";
import { SoundToggle } from "@/components/SoundToggle";
import { Wordmark } from "@/components/Wordmark";
import { usePlayerName } from "@/hooks/usePlayerName";
import { getEnabledCases } from "@/lib/cases/registry";

const ENABLED_CASES = getEnabledCases();

export function LandingHero() {
  const router = useRouter();
  const player = usePlayerName();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-12 sm:px-5">
      <div className="flex items-center justify-between gap-4 py-4">
        <Wordmark />
        <div className="flex items-center gap-4">
          <Link
            href="/board"
            className="min-h-[36px] font-label text-[12px] tracking-[0.08em] text-cream/75 underline decoration-cream/30 underline-offset-4"
          >
            Board
          </Link>
          <SoundToggle />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-start gap-10 py-4 lg:flex-row lg:items-center lg:gap-12">
        <div className="w-full lg:max-w-[30rem]">
          <h1 className="font-serif text-[34px] leading-[1.1] font-semibold text-cream sm:text-[47px]">
            Take the call.
            <br />
            Verify everything.
          </h1>

          <p className="mt-4 max-w-[42ch] text-[16px] leading-relaxed text-cream/90">
            Somebody is about to ask you to confirm something. Open the evidence,
            find a source they did not hand you, and build a Trust Chain you can defend.
          </p>

          <PlayerNameForm
            initialName={player.name ?? ""}
            buttonLabel="Deal me in"
            onSave={(name) => {
              player.saveName(name);
              router.push("/table");
            }}
          />

          <p className="mt-6 font-label text-[12px] tracking-[0.08em] text-cream/60">
            {ENABLED_CASES.length} cases on the table
          </p>

          <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-cream/60">
            Practice with invented people and organizations. No real offer or
            account is involved.
          </p>
        </div>

        <div className="w-full lg:flex-1">
          <HowToPlayCards />
        </div>
      </div>
    </main>
  );
}
