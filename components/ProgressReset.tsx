"use client";

import { useState } from "react";

type ProgressResetProps = {
  onReset: () => void;
};

export function ProgressReset({ onReset }: ProgressResetProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-[44px] font-sans text-[13px] text-cream/55 underline decoration-cream/30 underline-offset-4"
      >
        Reset progress
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <p className="text-[13px] text-cream/70">Clear every local score on this device?</p>
      <button
        type="button"
        onClick={() => {
          onReset();
          setConfirming(false);
        }}
        className="min-h-[44px] font-sans text-[13px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
      >
        Confirm reset
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="min-h-[44px] font-sans text-[13px] text-cream/55 underline decoration-cream/30 underline-offset-4"
      >
        Cancel
      </button>
    </div>
  );
}
