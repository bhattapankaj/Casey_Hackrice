import { Check } from "lucide-react";

export function MoriartyBadge() {
  return (
    <div className="relative flex size-[132px] shrink-0 items-center justify-center" role="img" aria-label="Moriarty-Proof deduction badge">
      <svg
        viewBox="0 0 160 160"
        className="absolute inset-0 size-full drop-shadow-[0_8px_14px_rgba(20,30,22,0.28)]"
        aria-hidden
      >
        <defs>
          <linearGradient id="moriarty-seal-gold" x1="25" y1="18" x2="139" y2="148" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F2D582" />
            <stop offset="0.48" stopColor="#CF9C2D" />
            <stop offset="1" stopColor="#8F6417" />
          </linearGradient>
          <path id="moriarty-seal-path" d="M 80,80 m -58,0 a 58,58 0 1,1 116,0 a 58,58 0 1,1 -116,0" />
        </defs>
        <circle cx="80" cy="80" r="75" fill="#252121" stroke="url(#moriarty-seal-gold)" strokeWidth="3" />
        <circle cx="80" cy="80" r="64" fill="none" stroke="#CF9C2D" strokeWidth="1" strokeDasharray="2 5" />
        <circle cx="80" cy="80" r="43" fill="url(#moriarty-seal-gold)" />
        <circle cx="80" cy="80" r="36" fill="#F5EFE0" stroke="#252121" strokeWidth="2" />
        <text fill="#F5EFE0" fontSize="10" fontFamily="ui-sans-serif, system-ui" letterSpacing="2.1">
          <textPath href="#moriarty-seal-path" startOffset="5%">
            MORIARTY PROOF • TRUST CHAIN •
          </textPath>
        </text>
        <text x="80" y="73" textAnchor="middle" fill="#252121" fontSize="17" fontWeight="700" fontFamily="Georgia, serif">
          221B
        </text>
      </svg>
      <Check size={30} strokeWidth={2.5} className="relative mt-8 text-felt-deep" aria-hidden />
    </div>
  );
}
