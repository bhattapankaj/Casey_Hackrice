import { Suspense } from "react";
import { CaseCatalog } from "@/components/CaseCatalog";
import { DemoReset } from "@/components/DemoReset";

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <DemoReset />
      </Suspense>
      <CaseCatalog />
    </>
  );
}
