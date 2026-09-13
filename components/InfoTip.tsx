"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

type InfoTipProps = {
  label: string;
  children: string;
  align?: "center" | "end";
};

export function InfoTip({ label, children, align = "center" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        className="inline-flex size-[14px] items-center justify-center text-cream/60"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={open ? `Hide ${label}` : `About ${label}`}
        onClick={() => setOpen((current) => !current)}
      >
        <Info size={14} strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <p
          id={popoverId}
          role="note"
          className={`surface-cream absolute top-full z-20 mt-2 w-[min(240px,calc(100vw-2.5rem))] rounded-[8px] border border-gold bg-cream p-3 text-left font-sans text-[12px] leading-relaxed text-ink shadow-[0_2px_8px_rgba(37,33,33,0.22)] ${
            align === "end"
              ? "left-0 min-[720px]:left-auto min-[720px]:right-0"
              : "left-1/2 -translate-x-1/2"
          }`}
        >
          {children}
        </p>
      ) : null}
    </span>
  );
}
