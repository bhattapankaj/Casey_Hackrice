"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CasinoChip, SuitMarks } from "@/components/CasinoDetails";
import { HowToPlayCards } from "@/components/HowToPlay";
import { PlayerNameForm } from "@/components/PlayerNameForm";
import { SiteNav } from "@/components/SiteNav";
import { usePlayerName } from "@/hooks/usePlayerName";
import { getEnabledCases } from "@/lib/cases/registry";
import { persistNickname, readStoredProgress } from "@/lib/progress";

const ENABLED_CASES = getEnabledCases();

export function LandingHero() {
  const router = useRouter();
  const player = usePlayerName();
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    setNickname(readStoredProgress().nickname ?? "");
  }, []);

  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-12 sm:px-5">
        <header className="mx-auto mt-4 max-w-[760px] text-center sm:mt-7">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-9 bg-gold/55" aria-hidden />
            <p className="font-label text-[10px] tracking-[0.2em] text-gold uppercase sm:text-[11px]">
              Baker Street Verification Club
            </p>
            <span className="h-px w-9 bg-gold/55" aria-hidden />
          </div>
          <h1 className="mt-3 font-serif text-[36px] leading-[1.04] font-semibold text-cream sm:text-[52px]">
            Take the call. Verify everything.
          </h1>
          <p className="mx-auto mt-3 max-w-[58ch] text-[15px] leading-relaxed text-cream/80 sm:text-[16px]">
            Read the tells, leave the caller&apos;s channel, and build a Trust Chain from
            a source they did not hand you.
          </p>
        </header>

        <section
          aria-label="Baker Street welcome table"
          className="relative mt-7 rounded-[34px] border-[9px] border-ink bg-felt-deep p-1.5 shadow-[0_22px_50px_rgba(17,28,22,0.48),inset_0_0_0_1px_rgba(245,239,224,0.18)] sm:rounded-[48px] sm:border-[12px] sm:p-2"
        >
          <div className="relative overflow-hidden rounded-[22px] border border-gold/70 bg-felt px-4 py-6 sm:rounded-[34px] sm:px-7 sm:py-8 lg:px-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_center,transparent_0%,transparent_52%,rgba(23,45,34,0.7)_100%)]"
            />
            <div className="relative flex items-center justify-between border-b border-cream/15 pb-4">
              <div>
                <p className="font-label text-[9px] tracking-[0.18em] text-cream/50 uppercase">
                  Private deduction table
                </p>
                <p className="mt-0.5 font-serif text-[18px] font-semibold text-cream">
                  The game is evidence. The stakes are judgment.
                </p>
              </div>
              <SuitMarks className="hidden sm:inline-flex" />
            </div>

            <div className="relative mt-7 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
              <div className="relative w-full">
                <div aria-hidden className="absolute -top-4 -right-1 hidden sm:block">
                  <CasinoChip label="221B" size={66} decorative />
                </div>
                <p className="font-label text-[10px] tracking-[0.16em] text-gold uppercase">
                  Reserve your detective seat
                </p>
                <PlayerNameForm
                  initialName={player.name ?? ""}
                  initialNickname={nickname}
                  buttonLabel="Deal me in"
                  onSave={(name, boardNickname) => {
                    if (!player.saveName(name)) return;
                    persistNickname(boardNickname, true);
                    router.push("/table");
                  }}
                />

                <div className="mt-5 flex items-center gap-3">
                  <CasinoChip
                    label={ENABLED_CASES.length}
                    size={42}
                    accent="var(--color-red)"
                    decorative
                  />
                  <div>
                    <p className="font-label text-[9px] tracking-[0.13em] text-cream/50 uppercase">
                      Cases currently dealt
                    </p>
                    <p className="mt-0.5 max-w-[40ch] text-[12px] leading-relaxed text-cream/65">
                      Every person and organization is fictional. No real account is involved.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-cream/15 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="font-label text-[10px] tracking-[0.16em] text-gold uppercase">
                    The house rules
                  </p>
                  <SuitMarks />
                </div>
                <HowToPlayCards />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
