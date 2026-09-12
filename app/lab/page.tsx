import { ArtifactCard } from "@/components/ArtifactCard";
import { Pip } from "@/components/Pip";
import { BAND_PHRASE, type Band, type Channel } from "@/lib/channels";

const PIP_SAMPLES: { channel: Channel; band: Band }[] = [
  { channel: "email", band: "in" },
  { channel: "email", band: "out" },
  { channel: "phone", band: "in" },
  { channel: "phone", band: "out" },
  { channel: "directory", band: "in" },
  { channel: "directory", band: "out" },
  { channel: "web", band: "in" },
  { channel: "web", band: "out" },
];

export default function IsolationPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col gap-12 px-5 py-10">
      <header className="max-w-[36rem]">
        <p className="font-label text-[12px] tracking-[0.08em] text-cream/80">
          Isolation review
        </p>
        <h1 className="mt-2 font-serif text-[24px] leading-tight font-semibold text-cream">
          ArtifactCard and Pip
        </h1>
        <p className="mt-3 max-w-[36rem] text-[16px] leading-relaxed text-cream/90">
          Chrome only. Compare the card geometry to the Casey logo,
          then tab through the buttons to check the gold focus ring.
        </p>
      </header>

      <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <img
          src="/casey-card.png"
          alt="Casey logo playing card with a red telephone pip"
          className="w-[140px] rotate-[8deg]"
        />
        <p className="max-w-[28rem] text-[15px] leading-relaxed text-cream/90">
          Logo reference. Cream face, gold hairline inset from the
          edge, point-symmetric corners. Game cards use the channel
          letter instead of C.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-[19px] font-semibold text-cream">
          Pip
        </h2>
        <p className="mt-1 max-w-[36rem] text-[15px] text-cream/90">
          Red means from the original message. Gold means found
          independently. Color is never the only cue.
        </p>
        <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {PIP_SAMPLES.map(({ channel, band }) => (
            <li key={`${channel}-${band}`} className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center bg-cream">
                <Pip channel={channel} band={band} />
              </span>
              <span className="font-sans text-[15px] text-cream">
                {channel}, {BAND_PHRASE[band]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-[19px] font-semibold text-cream">
          ArtifactCard
        </h2>
        <p className="mt-1 max-w-[36rem] text-[15px] text-cream/90">
          In-band pips are red. Out-of-band pips are gold. Facedown
          cards show only the diagonal back.
        </p>
        <div className="mt-6 flex flex-col items-center gap-7 min-[520px]:flex-row min-[520px]:flex-wrap min-[520px]:justify-center">
          <figure className="flex flex-col items-center gap-3">
            <ArtifactCard
              channel="email"
              band="in"
              label="Offer email"
              state="available"
            />
            <figcaption className="max-w-[180px] text-center text-[12px] leading-snug text-cream/80">
              Available, in band. Open the email.
            </figcaption>
          </figure>
          <figure className="flex flex-col items-center gap-3">
            <ArtifactCard
              channel="phone"
              band="in"
              label="Callback number"
              state="available"
            />
            <figcaption className="max-w-[180px] text-center text-[12px] leading-snug text-cream/80">
              Available, in band. Call this number.
            </figcaption>
          </figure>
          <figure className="flex flex-col items-center gap-3">
            <ArtifactCard
              channel="directory"
              band="out"
              label="Staff directory"
              state="available"
            />
            <figcaption className="max-w-[180px] text-center text-[12px] leading-snug text-cream/80">
              Available, out of band. Open the directory.
            </figcaption>
          </figure>
          <figure className="flex flex-col items-center gap-3">
            <ArtifactCard
              channel="web"
              band="out"
              label="Department page"
              state="opened"
            />
            <figcaption className="max-w-[180px] text-center text-[12px] leading-snug text-cream/80">
              Opened, out of band. Open the page.
            </figcaption>
          </figure>
          <figure className="flex flex-col items-center gap-3">
            <ArtifactCard
              channel="email"
              band="in"
              label="Offer email"
              state="facedown"
            />
            <figcaption className="max-w-[180px] text-center text-[12px] leading-snug text-cream/80">
              Facedown. No index, no label.
            </figcaption>
          </figure>
        </div>
      </section>
    </main>
  );
}
