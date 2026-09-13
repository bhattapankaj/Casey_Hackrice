"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { persistReset } from "@/lib/progress";

/** /?demo=1 wipes local progress and opens case-01 for a clean judge pass. */
export function DemoReset() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("demo") !== "1") {
      return;
    }
    persistReset();
    router.replace("/play/case-01");
  }, [params, router]);

  return null;
}
