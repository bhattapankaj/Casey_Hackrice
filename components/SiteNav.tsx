import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="flex items-baseline justify-between gap-4 px-5 pt-5">
      <Link
        href="/"
        className="font-serif text-[19px] font-semibold text-cream italic"
      >
        Casey
      </Link>
      <Link
        href="/board"
        className="font-label text-[12px] tracking-[0.08em] text-cream/80"
      >
        The board
      </Link>
    </nav>
  );
}
