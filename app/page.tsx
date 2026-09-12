import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col items-start justify-center px-5 py-16">
      <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
        <img
          src="/casey-card.png"
          alt="Casey playing card with a red telephone pip"
          className="w-[132px] rotate-[8deg]"
        />
        <div>
          <h1 className="font-serif text-[47px] leading-none font-bold text-cream italic">
            Casey
          </h1>
          <p className="mt-3 text-[16px] text-cream/90">
            Take the call. Trust nothing.
          </p>
        </div>
      </div>

      <p className="mt-10 max-w-[36rem] text-[16px] leading-relaxed text-cream/90">
        You just received a research job offer. Open the evidence.
        Take the call. Then decide where your confirmation actually
        came from.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Link
          href="/play/case-01"
          className="inline-flex items-center gap-2 rounded-[12px] bg-cream px-5 py-3 font-sans text-[15px] font-semibold text-ink"
        >
          Deal me in
          <ArrowRight size={20} strokeWidth={1.75} aria-hidden />
        </Link>
        <Link
          href="/board"
          className="font-sans text-[15px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
        >
          See the board
        </Link>
      </div>
    </main>
  );
}
