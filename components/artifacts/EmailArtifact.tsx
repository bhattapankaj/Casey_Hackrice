"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { EmailContent } from "@/lib/cases/schema";

export function EmailArtifact({ content }: { content: EmailContent }) {
  const [expanded, setExpanded] = useState(false);

  const initials = content.fromName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  const details: [string, string][] = [
    ["from", `${content.fromName} <${content.fromEmail}>`],
    ["to", content.to ?? "you"],
  ];
  if (content.replyTo) {
    details.push(["reply-to", content.replyTo]);
  }
  if (content.mailedBy) {
    details.push(["mailed-by", content.mailedBy]);
  }
  if (content.signedBy) {
    details.push(["signed-by", content.signedBy]);
  }
  details.push(["date", content.timestamp]);

  return (
    <div className="artifact bg-white px-5 py-5 text-[#202124]">
      <h3 className="text-[20px] leading-snug font-normal">{content.subject}</h3>

      <div className="mt-4 flex items-start gap-3 border-b border-[#e8eaed] pb-4">
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-[13px] font-semibold text-white"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[15px] font-semibold">{content.fromName}</p>
            <p className="shrink-0 text-[13px] text-[#5f6368]">
              {content.timestamp}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <p className="truncate text-[14px] text-[#5f6368]">
              {content.fromEmail}
            </p>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-controls="email-detail"
              aria-label={
                expanded ? "Hide sender details" : "Show sender details"
              }
              className="flex size-8 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
            >
              <ChevronDown
                size={18}
                strokeWidth={2}
                aria-hidden
                className={expanded ? "rotate-180" : undefined}
              />
            </button>
          </div>

          {expanded ? (
            <dl
              id="email-detail"
              className="mt-3 grid grid-cols-[84px_1fr] gap-x-3 gap-y-1 border-l-2 border-[#e8eaed] pl-3 text-[13px]"
            >
              {details.map(([term, value]) => (
                <div key={term} className="contents">
                  <dt className="text-right text-[#5f6368]">{term}:</dt>
                  <dd className="break-words text-[#202124]">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3 text-[15px] leading-[1.65] text-[#3c4043]">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {content.link ? (
          <p>
            <a
              href={content.link.href}
              onClick={(event) => event.preventDefault()}
              className="text-[#1a73e8] underline"
            >
              {content.link.label}
            </a>
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <button
          type="button"
          aria-label="Reply. This is a simulated message and cannot be sent."
          className="rounded-full px-6 py-2.5 text-[14px] font-medium text-white"
          style={{ backgroundColor: "#1a73e8" }}
        >
          Reply
        </button>
      </div>
    </div>
  );
}
