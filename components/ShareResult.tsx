"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ScoreReceipt } from "@/lib/engine/types";
import { buildShareText } from "@/lib/share-result";

type ShareResultProps = {
  receipt: ScoreReceipt;
};

export function ShareResult({ receipt }: ShareResultProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const origin = window.location.origin;
    const text = buildShareText(receipt, origin);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(field);
      if (!ok) {
        return;
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex min-h-[44px] items-center gap-2 font-sans text-[16px] font-semibold text-cream underline decoration-cream/40 underline-offset-4"
    >
      {copied ? (
        <Check size={18} strokeWidth={2} aria-hidden className="text-gold" />
      ) : (
        <Copy size={18} strokeWidth={1.75} aria-hidden className="text-gold" />
      )}
      {copied ? "Copied" : "Copy result"}
    </button>
  );
}
