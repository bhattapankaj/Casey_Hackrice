"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mic, MicOff, PhoneOff, X } from "lucide-react";
import { Pip } from "@/components/Pip";
import { CHANNEL_CLOSE_LABEL } from "@/lib/channels";
import type { CallContent, CaseArtifact, DirectoryContent, EmailContent } from "@/lib/cases";
import { BACKDROP_DURATION, EASE_OPEN, OPEN_DURATION, REDUCE_DURATION } from "@/lib/motion";

type ArtifactViewerProps = {
  artifact: CaseArtifact;
  onClose: () => void;
  onAnnounce: (message: string) => void;
};

const WAVEFORM = [18, 28, 22, 36, 44, 30, 48, 26, 38, 20, 42, 32, 24, 40, 18, 34, 28, 46, 22, 36];

export function ArtifactViewer({ artifact, onClose, onAnnounce }: ArtifactViewerProps) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeLabel = CHANNEL_CLOSE_LABEL[artifact.channel];
  const layoutId = reduce ? undefined : `artifact-${artifact.id}`;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const previous = document.activeElement;
    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => !node.hasAttribute("disabled"));

    focusables()[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
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
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6">
      <motion.button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 cursor-default"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? REDUCE_DURATION : BACKDROP_DURATION }}
        style={{ backgroundColor: "rgba(42, 84, 64, 0.72)" }}
        onClick={onClose}
      />

      <motion.div
        ref={panelRef}
        layoutId={layoutId}
        role="dialog"
        aria-modal="true"
        aria-labelledby="artifact-title"
        className="relative z-10 flex max-h-[86vh] w-full max-w-[720px] flex-col rounded-[12px] bg-cream p-5 shadow-[0_2px_8px_rgba(37,33,33,0.18)]"
        transition={{
          duration: reduce ? REDUCE_DURATION : OPEN_DURATION,
          ease: EASE_OPEN,
        }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col rounded-[6px] border-[1.5px] border-gold p-5">
          <div className="mb-3 flex items-start justify-between gap-4">
            <h2
              id="artifact-title"
              className="font-serif text-[19px] font-semibold text-ink"
            >
              {artifact.label}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 font-sans text-[15px] font-semibold text-ink"
            >
              {closeLabel}
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <div
            className="artifact min-h-0 flex-1 overflow-auto rounded-[4px] bg-white"
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
                onEnd={onClose}
                onAnnounce={onAnnounce}
              />
            ) : null}
          </div>

          <p className="mt-3 flex items-center gap-2 font-sans text-[15px] text-ink">
            <Pip channel={artifact.channel} band={artifact.band} size={16} decorative />
            <span>{artifact.provenance}</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EmailArtifact({ content }: { content: EmailContent }) {
  const initials = content.fromName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="artifact bg-white px-5 py-5 text-[#202124]">
      <div className="flex items-start gap-3 border-b border-[#e8eaed] pb-4">
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-[13px] font-semibold text-white"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[14px] font-semibold">{content.fromName}</p>
            <p className="shrink-0 text-[12px] text-[#5f6368]">{content.timestamp}</p>
          </div>
          <p className="text-[13px] text-[#5f6368]">{content.fromEmail}</p>
          <p className="text-[12px] text-[#5f6368]">to me</p>
        </div>
      </div>

      <h3 className="mt-4 text-[18px] font-normal">{content.subject}</h3>

      <div className="mt-4 space-y-3 text-[14px] leading-[1.6] text-[#3c4043]">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          <a
            href={content.link.href}
            onClick={(event) => event.preventDefault()}
            className="text-[#1a73e8] underline"
          >
            {content.link.label}
          </a>
        </p>
      </div>

      <div className="mt-6">
        <button
          type="button"
          aria-label="Reply. This sample message cannot be sent."
          className="rounded px-4 py-2 text-[14px] font-medium text-white"
          style={{ backgroundColor: "#1a73e8" }}
        >
          Reply
        </button>
      </div>
    </div>
  );
}

function DirectoryArtifact({ content }: { content: DirectoryContent }) {
  const initials = content.name
    .replace(", Ph.D.", "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="artifact bg-white text-[#222222]">
      <div className="bg-[#003366] px-4 py-2 text-white">
        <p className="text-[15px] font-semibold">{content.university}</p>
        <p className="text-[11px] text-[#d6dde6]">Faculty and Staff Directory</p>
      </div>
      <div className="border-b border-[#c8c8c8] bg-[#eef1f4] px-4 py-1.5 text-[12px] text-[#444444]">
        {content.breadcrumbs.map((crumb, index) => (
          <span key={crumb}>
            {index > 0 ? <span className="text-[#888888]"> / </span> : null}
            {crumb}
          </span>
        ))}
      </div>
      <div className="grid gap-6 px-4 py-5 md:grid-cols-[1fr_180px]">
        <div>
          <div className="flex gap-4">
            <div
              aria-hidden
              className="flex h-[120px] w-[96px] shrink-0 items-center justify-center bg-[#d0d0d0] text-[20px] font-semibold text-[#666666]"
            >
              {initials}
            </div>
            <div>
              <h3 className="text-[20px] font-semibold">{content.name}</h3>
              <p className="mt-1 text-[14px]">{content.title}</p>
              <p className="text-[13px] text-[#444444]">{content.department}</p>
            </div>
          </div>
          <dl className="mt-5 text-[13px]">
            <div className="grid grid-cols-[72px_1fr] gap-2 border-t border-[#dddddd] py-2">
              <dt className="text-[#555555]">Office</dt>
              <dd>{content.office}</dd>
            </div>
            <div className="grid grid-cols-[72px_1fr] gap-2 border-t border-[#dddddd] py-2">
              <dt className="text-[#555555]">Email</dt>
              <dd>
                <a
                  href={`mailto:${content.email}`}
                  onClick={(event) => event.preventDefault()}
                  className="text-[#003366] underline"
                >
                  {content.email}
                </a>
              </dd>
            </div>
            <div className="grid grid-cols-[72px_1fr] gap-2 border-t border-[#dddddd] py-2">
              <dt className="text-[#555555]">Phone</dt>
              <dd>{content.phone}</dd>
            </div>
          </dl>
          {content.note ? (
            <p className="mt-4 border-t border-[#dddddd] pt-3 text-[13px] leading-[1.6] text-[#444444]">
              {content.note}
            </p>
          ) : null}
        </div>
        <aside className="border-t border-[#dddddd] pt-3 text-[13px] md:border-t-0 md:border-l md:pl-4">
          <p className="mb-2 font-semibold text-[#003366]">On this site</p>
          <ul className="space-y-1 text-[#003366]">
            {content.sidebar.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function CallArtifact({
  content,
  onEnd,
  onAnnounce,
}: {
  content: CallContent;
  onEnd: () => void;
  onAnnounce: (message: string) => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    onAnnounce(`Call started with ${content.contactName}.`);
    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);
    return () => {
      window.clearInterval(timer);
      onAnnounce("Call ended.");
    };
  }, [content.contactName, onAnnounce]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");

  return (
    <div className="artifact flex min-h-[380px] flex-col items-center bg-[#f7f7f8] px-6 py-10 text-[#1d1d1f]">
      <p className="text-[28px] font-semibold">{content.contactName}</p>
      <p className="mt-1 text-[14px] text-[#6e6e73]">{content.number}</p>
      <p className="mt-4 flex items-center gap-2 text-[15px] text-[#6e6e73]">
        <span className="call-pulse size-2 rounded-full bg-[#34c759]" aria-hidden />
        <span aria-live="off">
          {minutes}:{remainder}
        </span>
      </p>
      <div className="mt-10 flex h-16 items-end gap-1" aria-hidden>
        {WAVEFORM.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="w-1 rounded-sm bg-[#c7c7cc]"
            style={{ height }}
          />
        ))}
      </div>
      <div className="mt-auto flex items-center gap-8 pt-10">
        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
          className="flex size-16 flex-col items-center justify-center rounded-full bg-[#e5e5ea] text-[#1d1d1f]"
          aria-pressed={muted}
          aria-label={muted ? "Unmute the call" : "Mute the call"}
        >
          {muted ? (
            <MicOff size={22} strokeWidth={1.75} aria-hidden />
          ) : (
            <Mic size={22} strokeWidth={1.75} aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={onEnd}
          className="flex size-16 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: "#ff3b30" }}
          aria-label="End the call"
        >
          <PhoneOff size={22} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </div>
  );
}
