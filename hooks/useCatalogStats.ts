"use client";

import { useCallback, useEffect, useState } from "react";
import { CASE_ORDER } from "@/lib/cases/registry";
import {
  PROGRESS_STORAGE_KEY,
  catalogStats,
  caseStatus,
  emptyProgress,
  parseProgress,
  persistReset,
  type CatalogStats,
  type ProgressV1,
} from "@/lib/progress";

export function useCatalogStats() {
  const [progress, setProgress] = useState<ProgressV1>(emptyProgress);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setProgress(parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY)));
    } catch {
      setProgress(emptyProgress());
    } finally {
      setReady(true);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(persistReset());
  }, []);

  return {
    ready,
    progress,
    stats: catalogStats(progress, CASE_ORDER),
    statusFor: (caseId: string) => caseStatus(progress, caseId),
    reset,
  };
}

export type { CatalogStats };
