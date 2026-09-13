import Link from "next/link";
import { CardTable } from "@/components/CardTable";
import { getCase } from "@/lib/cases/registry";

type PlayPageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function PlayPage({ params }: PlayPageProps) {
  const { caseId } = await params;
  const gameCase = getCase(caseId);

  if (!gameCase) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[36rem] flex-col justify-center px-5 py-16">
        <h1 className="font-serif text-[24px] font-semibold text-cream">
          This case could not be loaded.
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-cream/90">
          The address is wrong, or the case file is missing. Open a
          case from the start screen.
        </p>
        <Link
          href="/"
          className="mt-6 font-sans text-[15px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
        >
          Return to the start screen
        </Link>
      </main>
    );
  }

  return <CardTable gameCase={gameCase} />;
}
