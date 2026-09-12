import { BAND_PHRASE, CHANNEL_ICONS, type Band, type Channel } from "@/lib/channels";

type PipProps = {
  channel: Channel;
  band: Band;
  size?: number;
  decorative?: boolean;
  className?: string;
};

export function Pip({
  channel,
  band,
  size = 20,
  decorative = false,
  className,
}: PipProps) {
  const Icon = CHANNEL_ICONS[channel];
  const phrase = BAND_PHRASE[band];
  const tone = band === "in" ? "text-red" : "text-gold";

  return (
    <span
      className={`inline-flex shrink-0 ${tone}${className ? ` ${className}` : ""}`}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : phrase}
      aria-hidden={decorative || undefined}
    >
      <Icon size={size} strokeWidth={1.75} aria-hidden />
    </span>
  );
}
