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
  onOpen?: () => void;
  layoutId?: string;
  interactive?: boolean;
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
  onOpen,
  layoutId,
  interactive = true,
  className,
}: ArtifactCardProps) {
  const Icon = CHANNEL_ICONS[channel];
  const facedown = state === "facedown";
  const action = CHANNEL_OPEN_LABEL[channel];
  const phrase = BAND_PHRASE[band];
  const classes = [
    "relative aspect-[3/4] w-[180px] overflow-hidden rounded-[12px] bg-cream",
    "shadow-[0_2px_8px_rgba(37,33,33,0.18)]",
    "transition-[box-shadow] duration-150 ease-in-out",
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

          <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
            <Icon
              size={48}
              strokeWidth={1.75}
              aria-hidden
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${band === "in" ? "text-red" : "text-gold"} opacity-[0.12]`}
            />
            <span className="relative font-sans text-[15px] font-semibold leading-snug text-ink">
              {label}
            </span>
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
        aria-label={
          facedown
            ? "Facedown evidence card"
            : `${label}, ${phrase}.`
        }
      >
        {face}
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      id={id}
      layoutId={layoutId}
      onClick={onOpen}
      aria-label={`${action}. ${phrase}.`}
      className={`${classes} cursor-pointer text-center hover:shadow-[0_4px_10px_rgba(37,33,33,0.22)]`}
    >
      {face}
    </motion.button>
  );
}
