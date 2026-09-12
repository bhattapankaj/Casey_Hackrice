import Image from "next/image";

type WordmarkProps = {
  size?: "sm" | "lg";
  sublabel?: string;
};

export function Wordmark({ size = "sm", sublabel }: WordmarkProps) {
  const large = size === "lg";

  return (
    <span className={`inline-flex items-center ${large ? "gap-6" : "gap-2.5"}`}>
      <Image
        src="/casey-card.png"
        alt=""
        aria-hidden
        width={large ? 124 : 27}
        height={large ? 171 : 37}
        priority={large}
        className={
          large
            ? "h-auto w-[96px] drop-shadow-[0_3px_10px_rgba(37,33,33,0.3)] min-[520px]:w-[124px]"
            : "h-auto w-[27px] drop-shadow-[0_1px_3px_rgba(37,33,33,0.3)]"
        }
      />
      <span className="flex flex-col items-center">
        <span
          className={`font-serif font-bold text-cream italic leading-none ${
            large ? "text-[52px] min-[520px]:text-[68px]" : "text-[19px]"
          }`}
        >
          Casey
        </span>
        {sublabel ? (
          <span className="mt-2 font-label text-[12px] tracking-[0.08em] text-gold min-[520px]:text-[15px]">
            {sublabel}
          </span>
        ) : null}
      </span>
    </span>
  );
}
