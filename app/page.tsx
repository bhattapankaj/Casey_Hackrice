import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArtifactCard } from "@/components/ArtifactCard";
import { SoundToggle } from "@/components/SoundToggle";
import { Wordmark } from "@/components/Wordmark";

const STEPS = [
  { index: "One", text: "Open the evidence they sent you." },
  { index: "Two", text: "Find a source they did not give you." },
  { index: "Three", text: "Call it, and read your receipt." },
];

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[760px] flex-col justify-center overflow-hidden px-5 pt-16 pb-[190px]">
      <div className="absolute top-5 right-5 z-10">
        <SoundToggle />
      </div>

      <h1>
        <Wordmark size="lg" sublabel="HackRice 16" />
      </h1>

      <p className="mt-8 max-w-[26ch] font-serif text-[30px] leading-tight font-semibold text-cream min-[520px]:text-[37px]">
        Take the call. Trust nothing.
      </p>

      <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-cream/90">
        A research job offer just landed in your inbox. Somebody is about to
        call and walk you through confirming it. Your job is to decide where
        your confirmation actually came from.
      </p>

      <ol className="mt-9 flex max-w-[46ch] flex-col gap-3">
        {STEPS.map((step) => (
          <li key={step.index} className="flex items-baseline gap-4">
            <span className="w-[3.5rem] shrink-0 font-label text-[12px] tracking-[0.08em] text-gold">
              {step.index}
            </span>
            <span className="text-[15px] text-cream/90">{step.text}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <Link
          href="/play/case-01"
          className="inline-flex items-center gap-2 rounded-[12px] bg-cream px-5 py-3 font-sans text-[15px] font-semibold text-ink transition-shadow duration-150 hover:shadow-[0_4px_12px_rgba(37,33,33,0.25)]"
        >
          Deal me in
          <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
        </Link>
        <Link
          href="/board"
          className="font-sans text-[15px] font-semibold text-cream underline decoration-cream/40 underline-offset-4 transition-colors duration-150 hover:decoration-cream"
        >
          See the board
        </Link>
      </div>

      {/* The hand waiting to be dealt, resting against the near edge of the table. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-96px] left-1/2 flex origin-bottom -translate-x-1/2 scale-75 items-end min-[520px]:bottom-[-118px] min-[520px]:scale-100"
      >
        <div className="translate-y-[30px] -rotate-[15deg]">
          <ArtifactCard channel="email" band="in" label="" state="facedown" />
        </div>
        <div className="z-10 -mx-8">
          <ArtifactCard channel="phone" band="in" label="" state="facedown" />
        </div>
        <div className="translate-y-[30px] rotate-[15deg]">
          <ArtifactCard channel="web" band="out" label="" state="facedown" />
        </div>
      </div>
    </main>
  );
}
