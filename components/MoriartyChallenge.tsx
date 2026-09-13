"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Fingerprint,
  Search,
  ShieldCheck,
  ShieldX,
  Sparkles,
} from "lucide-react";
import { MoriartyBadge } from "@/components/MoriartyBadge";
import {
  buildMoriartyPlanFromArtifacts,
  judgeMoriartyDefense,
} from "@/lib/engine/moriarty";
import type { ScoreReceipt } from "@/lib/engine/types";
import {
  fallbackMoriartyResponse,
  parseMoriartyCopyResponse,
  type MoriartyCopyResponse,
} from "@/lib/gemini/challenge";
import { play } from "@/lib/sound";

type MoriartyChallengeProps = {
  receipt: ScoreReceipt;
};

export function MoriartyChallenge({ receipt }: MoriartyChallengeProps) {
  const reduce = useReducedMotion();
  const plan = useMemo(
    () =>
      buildMoriartyPlanFromArtifacts(
        receipt.caseId,
        receipt.caseTitle,
        receipt.pinnedArtifacts,
      ),
    [receipt.caseId, receipt.caseTitle, receipt.pinnedArtifacts],
  );
  const [challenge, setChallenge] = useState<MoriartyCopyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const result = selectedOptionId
    ? judgeMoriartyDefense(plan, selectedOptionId)
    : null;
  const selectedOption = plan.options.find((option) => option.id === selectedOptionId);

  async function inviteMoriarty() {
    setLoading(true);
    setSelectedOptionId(null);
    try {
      const response = await fetch("/api/gemini/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caseId: receipt.caseId,
          pinnedArtifactIds: receipt.pinnedArtifacts.map((artifact) => artifact.id),
        }),
      });
      const body: unknown = response.ok ? await response.json() : null;
      setChallenge(parseMoriartyCopyResponse(body) ?? fallbackMoriartyResponse(plan));
    } catch {
      setChallenge(fallbackMoriartyResponse(plan));
    } finally {
      setLoading(false);
      play("reveal");
    }
  }

  function choose(optionId: string) {
    if (selectedOptionId) return;
    setSelectedOptionId(optionId);
    play(plan.correctOptionIds.includes(optionId) ? "submit" : "chip");
  }

  const deterministicExplanation =
    result?.outcome === "chain_held"
      ? `${selectedOption?.label ?? "That exhibit"} traces to ${selectedOption?.sourceRootLabel ?? "a separate source"}, outside the claimant's control.`
      : result?.outcome === "weakness_spotted"
        ? "Casey confirms that none of the pinned exhibits came from an independent source. Recognizing weak proof is the correct defense."
        : plan.kind === "defend_independence"
          ? "An independent source was present. Follow the gold source seal, not merely a different channel."
          : "Every pinned exhibit leads back to the claimant. A different card does not guarantee a different source.";

  return (
    <section
      className="relative mt-10 overflow-hidden rounded-[18px] border border-cream/20 bg-[linear-gradient(135deg,rgba(37,33,33,0.96),rgba(68,35,33,0.92)_48%,rgba(42,84,64,0.96))] shadow-[0_18px_46px_rgba(24,37,29,0.35)]"
      aria-labelledby="moriarty-title"
    >
      <svg
        viewBox="0 0 900 250"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        aria-hidden
      >
        <motion.path
          d="M-20 210 C145 35 230 230 390 92 S665 20 930 168"
          fill="none"
          stroke="#B9342B"
          strokeWidth="2"
          strokeDasharray="7 9"
          initial={reduce ? undefined : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: "easeOut" }}
        />
        <circle cx="390" cy="92" r="5" fill="#CF9C2D" />
        <circle cx="666" cy="52" r="5" fill="#CF9C2D" />
      </svg>

      <div className="relative border-b border-cream/15 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-label text-[11px] tracking-[0.15em] text-gold">
            <Fingerprint size={15} strokeWidth={1.8} aria-hidden />
            GEMINI DEDUCTION
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 bg-ink/35 px-3 py-1 font-label text-[10px] tracking-[0.1em] text-cream/75">
            <Sparkles size={12} strokeWidth={1.8} aria-hidden className="text-gold" />
            {challenge?.source === "gemini"
              ? "GEMINI LIVE"
              : challenge?.source === "fallback"
                ? "CASEY FALLBACK"
                : "READY"}
          </span>
        </div>
      </div>

      <div className="relative p-5 sm:p-7">
        {!challenge ? (
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-label text-[10px] tracking-[0.16em] text-cream/55">A FINAL TEST OF PROOF</p>
              <h2 id="moriarty-title" className="mt-2 font-serif text-[27px] font-semibold text-cream sm:text-[32px]">
                Moriarty&apos;s Objection
              </h2>
              <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-cream/80">
                The verdict is locked. Now let Gemini&apos;s Moriarty attack one assumption in your Trust Chain. Casey, not AI, judges whether your defense survives.
              </p>
            </div>
            <button
              type="button"
              onClick={inviteMoriarty}
              disabled={loading}
              className="surface-cream inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] bg-cream px-6 font-sans text-[15px] font-semibold text-ink transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Search size={18} strokeWidth={2} aria-hidden className={reduce ? "" : "animate-pulse"} />
                  Tracing sources...
                </>
              ) : (
                <>
                  <Fingerprint size={18} strokeWidth={2} aria-hidden />
                  Invite Moriarty
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="grid gap-5 md:grid-cols-[110px_1fr] md:items-start">
              <div className="relative mx-auto flex size-[92px] items-center justify-center rounded-full border border-red/55 bg-red/15 text-cream md:mx-0">
                <span className="font-serif text-[46px] font-semibold leading-none">M</span>
                <span className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border border-gold/70 bg-ink text-gold">
                  <Search size={16} strokeWidth={2} aria-hidden />
                </span>
              </div>
              <div>
                <p className="font-label text-[10px] tracking-[0.16em] text-red/90">OBJECTION ENTERED</p>
                <h2 id="moriarty-title" className="mt-2 font-serif text-[24px] font-semibold leading-snug text-cream sm:text-[28px]">
                  “{challenge.copy.objection}”
                </h2>
                <p className="mt-3 text-[16px] leading-relaxed text-cream/85">
                  {challenge.copy.question}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {plan.options.map((option, index) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrect = plan.correctOptionIds.includes(option.id);
                const revealCorrect = Boolean(result && isCorrect);
                const isTarget = !result && option.id === plan.focusArtifactId;
                return (
                  <motion.button
                    type="button"
                    key={option.id}
                    onClick={() => choose(option.id)}
                    disabled={Boolean(result)}
                    initial={reduce ? undefined : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduce ? 0 : index * 0.07 }}
                    className={`relative min-h-[76px] rounded-[12px] border p-4 text-left transition-colors duration-150 ${
                      isSelected && result?.correct
                        ? "border-gold bg-gold/15"
                        : isSelected
                          ? "border-red bg-red/15"
                          : revealCorrect
                            ? "border-gold/70 bg-gold/10"
                            : "border-cream/20 bg-ink/25 hover:border-cream/45 hover:bg-cream/5"
                    } disabled:cursor-default`}
                  >
                    {isTarget ? (
                      <span className="absolute top-2 right-2 font-label text-[9px] tracking-[0.12em] text-red/90">UNDER DOUBT</span>
                    ) : null}
                    <span className="flex items-start gap-3">
                      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${revealCorrect ? "border-gold text-gold" : "border-cream/30 text-cream/65"}`}>
                        {revealCorrect ? <Check size={14} strokeWidth={2.5} aria-hidden /> : <span className="text-[11px]">{index + 1}</span>}
                      </span>
                      <span>
                        <span className="block pr-16 text-[14px] font-semibold leading-snug text-cream">{option.label}</span>
                        <span className="mt-1 block text-[11px] leading-snug text-cream/55">{option.sourceRootLabel}</span>
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {result ? (
              <motion.div
                role="status"
                initial={reduce ? undefined : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 rounded-[14px] border p-5 ${result.correct ? "border-gold/55 bg-gold/10" : "border-red/55 bg-red/10"}`}
              >
                <div className={`grid gap-5 ${result.outcome === "chain_held" ? "sm:grid-cols-[1fr_auto] sm:items-center" : ""}`}>
                  <div>
                    <p className="flex items-center gap-2 font-label text-[10px] tracking-[0.14em] text-cream/65">
                      {result.correct ? <ShieldCheck size={17} strokeWidth={2} aria-hidden className="text-gold" /> : <ShieldX size={17} strokeWidth={2} aria-hidden className="text-red" />}
                      {result.outcome === "chain_held"
                        ? "CHAIN HELD"
                        : result.outcome === "weakness_spotted"
                          ? "WEAKNESS SPOTTED"
                          : "OBJECTION SUSTAINED"}
                    </p>
                    <p className="mt-3 font-serif text-[19px] leading-relaxed text-cream">
                      “{result.correct ? challenge.copy.successLine : challenge.copy.failureLine}”
                    </p>
                    <p className="mt-3 max-w-[58ch] text-[14px] leading-relaxed text-cream/75">
                      {deterministicExplanation}
                    </p>
                    <p className="mt-3 text-[11px] leading-relaxed text-cream/50">
                      This deduction is cosmetic. Your authored verdict and score remain unchanged.
                    </p>
                  </div>
                  {result.outcome === "chain_held" ? <MoriartyBadge /> : null}
                </div>
              </motion.div>
            ) : (
              <p className="mt-4 text-[12px] text-cream/55" aria-live="polite">
                Select one answer. Casey will verify it against the authored source graph.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
