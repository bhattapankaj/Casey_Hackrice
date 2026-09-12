"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pin, PinOff, X } from "lucide-react";
import { CallArtifact } from "@/components/artifacts/CallArtifact";
import { DirectoryArtifact } from "@/components/artifacts/DirectoryArtifact";
import { EmailArtifact } from "@/components/artifacts/EmailArtifact";
import { Pip } from "@/components/Pip";
import { BAND_LABEL } from "@/lib/channels";
import type { CaseArtifact } from "@/lib/cases";
import {
  BACKDROP_DURATION,
  EASE_OPEN,
  OPEN_DURATION,
  REDUCE_DURATION,
} from "@/lib/motion";

type ArtifactViewerProps = {
  artifact: CaseArtifact;
  pinnedIds: string[];
  onTogglePin: (excerptId: string) => void;
  onClose: () => void;
  onAnnounce: (message: string) => void;
};

export function ArtifactViewer({
  artifact,
  pinnedIds,
  onTogglePin,
  onClose,
  onAnnounce,
}: ArtifactViewerProps) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const [callLive, setCallLive] = useState(false);
  const layoutId = `artifact-${artifact.id}`;

  // Closing a live call must also end it, so the microphone is never left running.
  const closeLabel = callLive ? "End the call and close" : "Close";

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const previous = document.activeElement;
    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => !node.hasAttribute("disabled"));

    focusables()[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const items = focusables();
      if (items.length === 0) {
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [handleClose]);

  return (
    <motion.div className="fixed inset-0 z-40 flex items-center justify-center px-3 py-4 sm:px-4 sm:py-6">
      <motion.button
        type="button"
        aria-label={closeLabel}
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? REDUCE_DURATION : BACKDROP_DURATION }}
        style={{ backgroundColor: "rgba(42, 84, 64, 0.72)" }}
        onClick={handleClose}
      />

      <motion.div
        ref={panelRef}
        layoutId={layoutId}
        role="dialog"
        aria-modal="true"
        aria-labelledby="artifact-title"
        className="surface-cream relative z-10 flex max-h-[92vh] w-full max-w-[720px] flex-col rounded-[12px] bg-cream p-3 shadow-[0_8px_28px_rgba(20,40,30,0.45)] sm:p-4"
        transition={{
          duration: reduce ? REDUCE_DURATION : OPEN_DURATION,
          ease: EASE_OPEN,
        }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col rounded-[6px] border-[1.5px] border-gold p-3 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="artifact-title"
                className="font-serif text-[20px] leading-tight font-semibold text-ink"
              >
                {artifact.label}
              </h2>
              {/* Origin is stated outside the artifact, never inside it. */}
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink/75">
                <Pip
                  channel={artifact.channel}
                  band={artifact.band}
                  size={15}
                  decorative
                />
                <span className="font-label text-[11px] tracking-[0.08em] text-ink/60">
                  {BAND_LABEL[artifact.band]}
                </span>
                <span aria-hidden className="text-ink/30">
                  |
                </span>
                <span>{artifact.originLabel}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-[8px] px-2 font-sans text-[15px] font-semibold text-ink hover:bg-ink/5"
            >
              {closeLabel}
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <div
            className="artifact min-h-0 flex-1 overflow-auto rounded-[4px] bg-white shadow-[inset_0_0_0_1px_rgba(37,33,33,0.1)]"
            data-artifact-kind={artifact.content.kind}
          >
            {artifact.content.kind === "email" ? (
              <EmailArtifact content={artifact.content} />
            ) : null}
            {artifact.content.kind === "directory" ? (
              <DirectoryArtifact content={artifact.content} />
            ) : null}
            {artifact.content.kind === "call" ? (
              <CallArtifact
                content={artifact.content}
                onAnnounce={onAnnounce}
                onLiveChange={setCallLive}
              />
            ) : null}
          </div>

          <div className="mt-3 shrink-0">
            <p className="font-label text-[11px] tracking-[0.08em] text-ink/60">
              Pin what you found
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {artifact.excerpts.map((excerpt) => {
                const pinned = pinnedIds.includes(excerpt.id);
                return (
                  <li key={excerpt.id}>
                    <button
                      type="button"
                      onClick={() => onTogglePin(excerpt.id)}
                      aria-pressed={pinned}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-[8px] border px-3 py-2 text-left text-[14px] leading-snug transition-colors duration-150 ${
                        pinned
                          ? "border-ink/40 bg-ink/10 text-ink"
                          : "border-ink/20 text-ink/80 hover:bg-ink/5"
                      }`}
                    >
                      {pinned ? (
                        <Pin size={16} strokeWidth={2} aria-hidden />
                      ) : (
                        <PinOff size={16} strokeWidth={1.75} aria-hidden />
                      )}
                      <span>{excerpt.text}</span>
                      <span className="sr-only">
                        {pinned ? "Pinned" : "Not pinned"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
