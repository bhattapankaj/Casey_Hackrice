"use client";

const FICTIONAL_PAYLOAD = [
  { label: "Name", value: "Avery Quinn" },
  { label: "Date of birth", value: "14 March 2004" },
  { label: "Campus ID", value: "HU-19482" },
] as const;

type IdFormConfirmProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

/** Preset fictional slip. Never renders an input for real personal data. */
export function IdFormConfirm({ onConfirm, onCancel }: IdFormConfirmProps) {
  return (
    <div className="surface-cream relative mt-4 max-w-[28rem] overflow-hidden rounded-[14px] bg-cream p-5 text-ink shadow-[0_3px_14px_rgba(20,32,24,0.28)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[7px] rounded-[8px] border-[1.5px] border-gold"
      />
      <div className="relative">
        <p className="font-label text-[11px] tracking-[0.14em] text-ink/50">
          FICTIONAL PAYLOAD
        </p>
        <p className="mt-1 font-serif text-[20px] leading-tight font-semibold">
          Send the ID form
        </p>
        <dl className="mt-4 border-t border-ink/10">
          {FICTIONAL_PAYLOAD.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 border-b border-ink/10 py-2.5"
            >
              <dt className="font-label text-[11px] tracking-[0.08em] text-ink/50">
                {row.label}
              </dt>
              <dd className="text-right font-sans text-[14px] text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[13px] leading-relaxed text-ink/60">
          Casey never asks for your real information.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-[40px] items-center rounded-full bg-ink px-5 font-sans text-[14px] font-semibold text-cream"
          >
            Confirm send
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[40px] font-sans text-[14px] font-semibold text-ink underline decoration-ink/35 underline-offset-4"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
