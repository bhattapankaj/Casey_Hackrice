"use client";

import { motion } from "framer-motion";
import { Pip } from "@/components/Pip";
import {
  BAND_PHRASE,
  CHANNEL_ICONS,
  CHANNEL_INDEX,
  CHANNEL_OPEN_LABEL,
  type Band,
  type CardState,
  type Channel,
} from "@/lib/channels";

export type ArtifactCardProps = {
  id?: string;
  channel: Channel;
  band: Band;
  label: string;
  state: CardState;
  /** Neutral fact shown once the card has been viewed. Never a verdict. */
  preview?: string;
  onOpen?: () => void;
  layoutId?: string;
  interactive?: boolean;
  /** Tailwind width classes. Height follows from the 3:4 ratio. */
  width?: string;
  className?: string;
};

function CornerIndex({ channel, band }: { channel: Channel; band: Band }) {
  return (
    <div className="flex w-5 flex-col items-center gap-0.5" aria-hidden>
      <span className="font-serif text-[15px] leading-none font-semibold text-ink">
        {CHANNEL_INDEX[channel]}
      </span>
      <Pip channel={channel} band={band} size={14} decorative />
    </div>
  );
}

export function ArtifactCard({
  id,
  channel,
  band,
  label,
  state,
  preview,
  onOpen,
  layoutId,
  interactive = true,
  width = "w-[190px]",
  className,
}: ArtifactCardProps) {
  const Icon = CHANNEL_ICONS[channel];
  const facedown = state === "facedown";
  const viewed = state === "viewed";
  const action = CHANNEL_OPEN_LABEL[channel];
  const phrase = BAND_PHRASE[band];

  const classes = [
    "surface-cream relative aspect-[3/4] overflow-hidden rounded-[12px] bg-cream",
    width,
    "shadow-[0_2px_8px_rgba(37,33,33,0.22)]",
    "transition-shadow duration-150 ease-in-out",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const face = (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[6px] rounded-[6px] border-[1.5px] border-gold"
      />

      {facedown ? (
        <div
          aria-hidden
          className="absolute inset-[8px] rounded-[4px] bg-[repeating-linear-gradient(-45deg,transparent,transparent_7px,rgba(207,156,45,0.2)_7px,rgba(207,156,45,0.2)_8px)]"
        />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-[14px]">
            <div className="absolute top-0 left-0">
              <CornerIndex channel={channel} band={band} />
            </div>
            <div className="absolute right-0 bottom-0 rotate-180">
              <CornerIndex channel={channel} band={band} />
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <Icon
              size={26}
              strokeWidth={1.75}
              aria-hidden
              className={band === "in" ? "text-red" : "text-gold"}
            />
            <span className="font-sans text-[16px] leading-snug font-semibold text-ink">
              {label}
            </span>

            <span
              className={`mt-0.5 font-label text-[11px] tracking-[0.08em] ${
                viewed ? "text-ink/70" : "text-ink/50"
              }`}
            >
              {viewed ? "Viewed" : "Unopened"}
            </span>

            {viewed && preview ? (
              <span className="mt-1 line-clamp-3 text-[12px] leading-snug text-ink/70">
                {preview}
              </span>
            ) : null}
          </div>
        </>
      )}
    </>
  );

  if (facedown || !interactive) {
    return (
      <motion.div
        layoutId={layoutId}
        className={classes}
        aria-label={facedown ? "Facedown evidence card" : `${label}, ${phrase}.`}
      >
        {face}
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      id={id}
      tabIndex={0}
      layoutId={layoutId}
      onClick={onOpen}
      aria-label={`${action}. ${phrase}. ${viewed ? "Already viewed." : "Not yet opened."}`}
      className={`${classes} cursor-pointer text-center hover:shadow-[0_6px_14px_rgba(37,33,33,0.28)]`}
    >
      {face}
    </motion.button>
  );
}
