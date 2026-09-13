import { Suspense } from "react";
import { DemoReset } from "@/components/DemoReset";
import { LandingHero } from "@/components/LandingHero";

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <DemoReset />
      </Suspense>
      <LandingHero />
    </>
  );
}
