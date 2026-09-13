"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChipBalance } from "@/components/ChipBalance";
import { SoundToggle } from "@/components/SoundToggle";
import { Wordmark } from "@/components/Wordmark";

const LINK_CLASS =
  "inline-block px-1 py-1.5 font-label text-[13px] font-medium tracking-[0.08em] text-cream/80 border-b-[1.5px]";

type SiteNavProps = {
  chips?: number;
};

export function SiteNav({ chips }: SiteNavProps) {
  const pathname = usePathname();
  const onTable = pathname === "/table" || pathname.startsWith("/play/");
  const onBoard = pathname === "/board";

  return (
    <nav className="flex items-center px-5 pt-5">
      <div className="flex min-w-[160px] flex-1 items-center justify-start">
        <Link
          href="/"
          aria-label="Casey, return to the start screen"
          className="inline-flex min-h-[44px] items-center"
        >
          <Wordmark />
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-7">
        <Link
          href="/table"
          aria-current={onTable ? "page" : undefined}
          className={`${LINK_CLASS} ${onTable ? "border-gold text-cream" : "border-transparent"}`}
        >
          Table
        </Link>
        <Link
          href="/board"
          aria-current={onBoard ? "page" : undefined}
          className={`${LINK_CLASS} ${onBoard ? "border-gold text-cream" : "border-transparent"}`}
        >
          Board
        </Link>
      </div>

      <div className="flex min-w-[160px] flex-1 items-center justify-end gap-4">
        <ChipBalance value={chips} />
        <SoundToggle />
      </div>
    </nav>
  );
}
