"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pin, PinOff, X } from "lucide-react";
import { DirectoryArtifact } from "@/components/artifacts/DirectoryArtifact";
import { EmailArtifact } from "@/components/artifacts/EmailArtifact";
import { Pip } from "@/components/Pip";
import { sourceClassToBand } from "@/lib/cases/public-case";
import type {
  Artifact,
  CallContent,
  PortalContent,
  WebContent,
} from "@/lib/cases/schema";
import { BAND_LABEL, CHANNEL_CLOSE_LABEL } from "@/lib/channels";
import {
  BACKDROP_DURATION,
  EASE_OPEN,
  OPEN_DURATION,
  REDUCE_DURATION,
} from "@/lib/motion";

type ArtifactViewerProps = {
  artifact: Artifact;
  isPinned: boolean;
  canPin: boolean;
  onPin: () => void;
  onUnpin: () => void;
  onClose: () => void;
  onAnnounce: (message: string) => void;
};

export function ArtifactViewer({
  artifact,
  isPinned,
  canPin,
  onPin,
  onUnpin,
  onClose,
  onAnnounce,
}: ArtifactViewerProps) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeLabel = CHANNEL_CLOSE_LABEL[artifact.channel];
  const band = sourceClassToBand(artifact.sourceClass);
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

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
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
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
      if (previous instanceof HTMLElement) previous.focus();
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
        layoutId={reduce ? undefined : `artifact-${artifact.id}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="artifact-title"
        className="surface-cream relative z-10 flex max-h-[92vh] w-full max-w-[720px] flex-col rounded-[12px] bg-cream p-3 shadow-[0_8px_28px_rgba(20,40,30,0.45)] sm:p-4"
        transition={{ duration: reduce ? REDUCE_DURATION : OPEN_DURATION, ease: EASE_OPEN }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col rounded-[6px] border-[1.5px] border-gold p-3 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="artifact-title" className="font-serif text-[20px] leading-tight font-semibold text-ink">
                {artifact.title}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink/75">
                <Pip channel={artifact.channel} band={band} size={15} decorative />
                <span className="font-label text-[11px] tracking-[0.08em] text-ink/60">
                  {BAND_LABEL[band]}
                </span>
                <span aria-hidden className="text-ink/30">|</span>
                <span>{artifact.provenance}</span>
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
            {artifact.content.kind === "email" ? <EmailArtifact content={artifact.content} /> : null}
            {artifact.content.kind === "directory" ? <DirectoryArtifact content={artifact.content} /> : null}
            {artifact.content.kind === "call" ? <AuthoredCallArtifact content={artifact.content} /> : null}
            {artifact.content.kind === "web" ? <WebArtifact content={artifact.content} /> : null}
            {artifact.content.kind === "portal" ? <PortalArtifact content={artifact.content} /> : null}
          </div>

          <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <p className="max-w-[48ch] text-[13px] leading-relaxed text-ink/65">
              Source: {artifact.sourceRootLabel}. Opening this card does not add it to your Trust Chain.
            </p>
            {isPinned ? (
              <button
                type="button"
                onClick={() => {
                  onUnpin();
                  onAnnounce(`${artifact.title} removed from the Trust Chain.`);
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[8px] border border-ink/25 px-3 py-2 text-[14px] font-semibold text-ink"
              >
                <PinOff size={16} strokeWidth={1.75} aria-hidden />
                Unpin evidence
              </button>
            ) : (
              <button
                type="button"
                disabled={!canPin}
                onClick={() => {
                  onPin();
                  onAnnounce(`${artifact.title} pinned to the Trust Chain.`);
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[8px] bg-ink px-3 py-2 text-[14px] font-semibold text-cream disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Pin size={16} strokeWidth={2} aria-hidden />
                {canPin ? "Pin as evidence" : "Trust Chain full"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AuthoredCallArtifact({ content }: { content: CallContent }) {
  return (
    <div className="artifact flex min-h-[320px] flex-col items-center bg-[#f7f7f8] px-6 py-10 text-[#1d1d1f]">
      <p className="text-[28px] font-semibold">{content.contactName}</p>
      <p className="mt-1 text-[14px] text-[#6e6e73]">{content.number}</p>
      <div className="mt-8 w-full max-w-[32rem] space-y-3" aria-label="Authored call record">
        {content.transcript.map((line) => (
          <p key={line} className="rounded-[10px] bg-white px-4 py-3 text-[14px] leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function WebArtifact({ content }: { content: WebContent }) {
  return (
    <div className="artifact min-h-[320px] bg-white text-[#222]">
      <div className="border-b border-[#ddd] bg-[#f4f4f4] px-5 py-3 text-[13px] text-[#555]">{content.url}</div>
      <div className="px-6 py-8">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#666]">{content.siteName}</p>
        <h3 className="mt-2 text-[26px] font-semibold">{content.heading}</h3>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#444]">
          {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </div>
    </div>
  );
}

function PortalArtifact({ content }: { content: PortalContent }) {
  return (
    <div className="artifact min-h-[320px] bg-white px-6 py-8 text-[#222]">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-[#666]">{content.serviceName}</p>
      <h3 className="mt-2 text-[26px] font-semibold">{content.heading}</h3>
      <dl className="mt-6 divide-y divide-[#ddd]">
        {content.rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_2fr] gap-4 py-3 text-[14px]">
            <dt className="text-[#666]">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
