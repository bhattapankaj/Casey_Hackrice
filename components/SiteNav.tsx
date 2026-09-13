import Link from "next/link";
import { SoundToggle } from "@/components/SoundToggle";
import { Wordmark } from "@/components/Wordmark";

export function SiteNav() {
  return (
    <nav className="flex items-center justify-between gap-4 px-5 pt-5">
      <Link
        href="/"
        aria-label="Casey, return to the start screen"
        className="inline-flex min-h-[44px] items-center"
      >
        <Wordmark />
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/board"
          className="min-h-[44px] font-label text-[12px] tracking-[0.08em] text-cream/75 underline decoration-cream/30 underline-offset-4"
        >
          Board
        </Link>
        <SoundToggle />
      </div>
    </nav>
  );
}
