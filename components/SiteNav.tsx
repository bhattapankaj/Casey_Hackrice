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
      <SoundToggle />
    </nav>
  );
}
