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
      <div className="flex items-center gap-5 min-[520px]:gap-7">
        <SoundToggle />
        <Link
          href="/board"
          className="inline-flex min-h-[44px] items-center font-label text-[12px] tracking-[0.08em] text-cream/80 transition-colors duration-150 hover:text-cream"
        >
          The board
        </Link>
      </div>
    </nav>
  );
}
