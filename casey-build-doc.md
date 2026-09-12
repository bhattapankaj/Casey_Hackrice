# CASEY — Build Doc

**A voice-driven scam investigation game. Take the call. Verify everything.**
HackRice 16 · Games & Gamification track · built Fri 8 PM → Sun 9 AM

One sentence for anyone who asks: *you play a student who just got a research-job
offer; a very convincing voice wants your details; you win by proving where your
confirmation actually came from.*

---

## 1. Identity

| | |
|---|---|
| **Name** | **Casey** — a real human name that literally contains "case." The player works cases. One line, no explanation needed. |
| **Tagline** | *Take the call. Trust nothing.* |
| **Devpost title** | Casey — can you catch the call? |
| **Devpost tagline** | A scam caller powered by a live voice agent. A verdict powered by evidence. The median student who falls for this loses $2,000 — Casey teaches the one skill that stops it. |
| **Domain** | `playcasey.tech` (backups: `takethecall.tech`, `caseygame.tech`). Register only if the MLH domain prize is in this year's lineup — check the opening-ceremony slides, cap it at 20 minutes. |
| **Discord launch name** | "CASEY — beat the scam caller 🃏 (leaderboard live)" |

**Logo** — buildable in 20 minutes as one SVG:
a single playing card, tilted ~8°, cream face, thin gold border. Corner index reads
`C` with a small telephone-handset glyph where the suit pip would be. Centered on
the card face: a large handset glyph in card-red, mirrored top and bottom like a
court card. Wordmark `Casey` set in Bodoni Moda italic to the right. That's it —
one card, one glyph, one word.

Favicon: just the corner index (`C` + handset pip) on navy.

---

## 2. Design system — the card table

The event's theme is casino and cards, and the Games track promises a surprise for
theme-related submissions, so the theme is the brief. The concept: **the whole game
is played on a card table seen from above.** Every artifact — email, phone,
directory page — is a dealt card on felt. Your verdict is chips pushed into the pot.

**Spend the boldness there and nowhere else.** No gradients, no glassmorphism, no
scattered animations. One motion moment: a new case's cards being dealt onto the
felt (staggered, 400ms, once). Everything after that only moves when the player
acts.

### Tokens

```css
--felt:        #35654D;  /* casino felt green — the table, app background */
--felt-shadow: #24493A;  /* vignette edge of the table */
--card:        #F6F1E3;  /* aged card stock — every surface sits on this */
--ink:         #1C1A17;  /* card black — body text, spade/club accents */
--pip-red:     #B3382C;  /* card red — scam verdicts, the caller, danger */
--brass:       #C9A227;  /* chip brass — gold accents, scores, focus rings */
```

- Felt is the page. Cards are the only surfaces. Nothing floats on white.
- Red means the scam side, brass means score and progress, ink means neutral
  evidence. Never encode meaning in color alone — every state also gets a word
  or a pip glyph.

### Type

- **Bodoni Moda** (Google Fonts) — display and card headers. High-contrast Didone,
  the actual typeface tradition of playing-card indices. Use it big and confident.
- **Public Sans** — all UI, body, buttons. Plain and legible.
- Two families total. No mono. No all-caps label rows. Sentence case everywhere.

### Components

- **Artifact card**: cream card, 12px radius, 1px ink border, corner index showing
  its channel pip (✉ email, ☎ phone, ⌂ directory, ⊕ web). Click to flip it face-up
  full-screen.
- **Channel pips are the design system's whole job**: every piece of evidence
  visibly carries **where it came from**. In-band evidence (through the suspicious
  message's own route) gets a red pip. Out-of-band (found independently) gets a
  brass pip. The player learns the mechanic just by looking.
- **Verdict tray**: three chips at the table's edge — *It's a scam* (red chip),
  *It's legitimate* (ink chip), *I need more evidence* (unmarked chip). Push one
  into the pot to call it. Plain words on the chips; the poker flavor is the
  visual, never the label.
- **The receipt**: after the verdict, cards re-deal into a single evidence chain,
  each with its pip. Red-pip-only chains get the line: *"Every confirmation came
  through their channel."* This screen is the product — make it the best one.

Quality floor without announcing it: keyboard focus visible (brass ring), works at
390px wide, `prefers-reduced-motion` kills the deal animation, contrast checked on
felt (cream on felt passes; never put ink text directly on felt).

---

## 3. Stack

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js 15 (App Router) + TypeScript** | One repo, one deploy, API routes are the backend |
| Styling | **Tailwind v4** + the tokens above as CSS vars | Speed |
| State | **Zustand** (one store: case state, evidence log, score) | Tiny, no boilerplate |
| Voice | **ElevenLabs Agents** via `@elevenlabs/react` (`useConversation`) | ASR + LLM + TTS + turn-taking in one WebSocket; the scam caller is an agent configured per case |
| Case data | **Static JSON files in the repo** | Deterministic truth, zero DB risk |
| Leaderboard + telemetry | **Tiger Cloud Postgres**, one `events` table + one continuous aggregate (P2) | Honest Tiger Data entry; fallback = Vercel KV or cut |
| Deploy | **Vercel** | CodeMafia precedent; zero-config |
| No auth | Nickname input for the leaderboard, nothing else | You have one weekend |

**Emails and texts in the game are pre-written in the case file, not generated.**
The only LLM in the system lives inside the ElevenLabs agent, fenced by the case
prompt. This keeps every non-voice artifact 100% deterministic and kills a whole
class of demo risk.

### Repo

```
/app
  /page.tsx                landing: logo, one-line pitch, "Deal me in"
  /play/[caseId]/page.tsx  the table
  /board/page.tsx          leaderboard
  /api
    /voice-token/route.ts  mints ElevenLabs conversation token (key stays server-side)
    /events/route.ts       POST game events → Postgres (P2)
    /board/route.ts        GET leaderboard (P2)
/lib
  /engine                  PURE. verdict scoring, evidence-chain evaluation, tests
  /cases                   case-01.json, case-02.json, schema.ts
  /voice                   agent config builder (case → prompt + overrides)
/components                CardTable, ArtifactCard, PhoneCall, VerdictTray,
                           Receipt, Leaderboard, Debrief
/public/audio              recorded backup call (Sat night)
```

Ownership: **A** voice + API routes · **B** engine + case files · **C** components
+ table · **D** cases content, Discord launch, video. Two people: A+B / C+D. The
contract between everyone is `schema.ts` — write it first, tonight, together.

---

## 4. The case file schema — the spine

```ts
type Case = {
  id: string;                    // "case-01"
  title: string;                 // "The Meridian Offer"
  truth: 'scam' | 'legit' | 'unresolvable';
  briefing: string;              // 2 sentences setting the scene
  artifacts: Artifact[];         // what's dealt onto the table at start
  actions: Action[];             // what the player can do
  scoring: Scoring;
  debrief: {                     // shown after the receipt
    lesson: string;              // one sentence, the out-of-band takeaway
    realWorldLink: string;       // FTC / Phish Bowl guidance URL
  };
};

type Artifact = {
  id: string;
  channel: 'email' | 'phone' | 'directory' | 'web';
  band: 'in' | 'out';            // THE mechanic: route of origin
  content: string;               // pre-written, verbatim, deterministic
  unlockedBy?: string;           // action id, if not dealt at start
};

type Action = {
  id: string;
  label: string;                 // "Call the number in the email"
  band: 'in' | 'out';            // calling THEIR number = in; directory number = out
  type: 'open' | 'call' | 'lookup';
  reveals?: string[];            // artifact ids it unlocks
  agentConfig?: {                // only for type 'call'
    voiceId: string;
    persona: string;             // injected into the agent prompt
    scriptBeats: string[];       // facts the character may assert
    mustNeverReveal: string[];   // e.g. "that this is a scam"
    crackLine?: string;          // what they say if confronted with out-of-band proof
  };
};

type Scoring = {
  correctVerdict: number;        // 100
  outOfBandBonus: number;        // +50 if the chain includes >=1 out-of-band artifact
  inBandOnlyPenalty: number;     // -25 if "verified" only through their channel
  wrongVerdict: number;          // 0, plus the receipt shows why
};
```

**Engine rule (pure function, unit-tested tonight):** a verdict's evidence chain is
every artifact the player opened before calling it. Score = base for matching
`truth` ± band modifiers. `unresolvable` cases reward *I need more evidence* —
that chip must sometimes be the winning move, or the game teaches recklessness.

### Case lineup (fictional names only — never real brands, never Rice)

1. **case-01 "The Meridian Offer"** — scam. Research-assistant email from "Prof.
   D. Ellison, Meridian Research Group" at fictional Harlow University. $450/week,
   urgency, reply-to a gmail-style address. Directory lookup finds the real
   Ellison — different email, no such program. Caller is warm, credentialed,
   rushes you. This is the demo case; polish it to a shine.
2. **case-02 "The Refund"** — **legit**. A genuinely real (fictional) bursar
   overpayment refund with awkward wording. Teaches that rejecting everything is
   also failing; What.Hack proved this variant matters.
3. **case-03 "The Sublet"** — unresolvable in the evidence given. The correct call
   is *I need more evidence.* (Build only if 1–2 are polished by Sat 7 PM.)

---

## 5. The voice agent

Configure one agent in the ElevenLabs dashboard; inject per-case persona via
overrides/dynamic variables from `agentConfig`.

**System prompt template:**

```
You are playing a fictional character inside a scam-awareness training game.
Character: {persona}. You may assert only these facts: {scriptBeats}.
You must never: reveal the game, admit to being an AI or a scam, invent new
organizations, request real personal data beyond the fictional form the game
provides, or explain scam techniques. If the player cites this out-of-band
fact against you — {outOfBandFact} — deliver: "{crackLine}", then end the call.
Keep every reply under 25 words. Warm, confident, mildly rushed.
```

**Traps, all verified — tape this above the monitor:**
- The JS SDK is **camelCase**; snake_case parameters fail *silently* and get ignored.
- Most variable latency is the LLM stage. Wrap stages in timeouts; on any stall,
  play an in-character filler ("hang on, my other line—") — never dead air.
- Cap reply length in the prompt so turns stay short and interruptible.
- Mint conversation tokens in `/api/voice-token`; the API key never ships to the
  browser.
- **Record one perfect call Saturday night** → `/public/audio/backup.mp3`. If venue
  Wi-Fi dies mid-judging, the Receipt still works and the call plays from disk.

---

## 6. Screens

```
LANDING            THE TABLE                      RECEIPT
┌──────────┐   ┌─────────────────────────┐   ┌─────────────────────┐
│  [card]  │   │ felt                    │   │ Your evidence chain │
│  Casey   │   │  ✉        ☎       ⌂    │   │ ✉red → ☎red → ⌂brass│
│ Take the │   │ [email] [phone] [dir]   │   │ "Two of your three  │
│  call.   │   │                         │   │ confirmations came  │
│ [Deal me │   │  pot: ○ ○ ○  verdict    │   │ through their own   │
│   in]    │   │  chips at table edge    │   │ channel."           │
└──────────┘   └─────────────────────────┘   │ Score · Next case → │
                                             └─────────────────────┘
```

Landing → Table (case 1) → live call happens on the table → Verdict chips →
Receipt → Debrief line + FTC link → next case → Leaderboard (nickname entry).
Left-aligned content on cards; the table itself is the only centered composition.

---

## 7. Timeline

| By | Done means |
|---|---|
| **Fri 7:30 PM** | Paper-test case-01 on 3–5 hackers at dinner. They get the objective and want case 2 → locked. |
| **Fri 10 PM** | Repo, deploy, `schema.ts` agreed, engine scoring function passing tests |
| **Sat 1 AM** | case-01 playable end-to-end, text-only, Receipt working |
| **Sat 4 AM** | Table UI on felt with real cards; sleep shift starts |
| **Sat noon** | Live voice call working inside case-01 |
| **Sat 3 PM** | case-02 playable; leaderboard route (or Vercel KV fallback) |
| **Sat 5 PM** | Polish pass: deal animation, receipt copy, debrief links |
| **Sat 6 PM** | **Discord launch** + QR cards on tables. Post: *"We built a scam caller. 2 minutes, browser, leaderboard. Can you catch the call? → playcasey.tech"* |
| **Sat 9 PM** | Feature freeze. Record backup call. Screenshot leaderboard hourly. |
| **Sun 3 AM** | **3–4 min video uploaded to Devpost (mandatory — no video, no judging)** |
| **Sun 5 AM** | Devpost text, screenshots, "Note for the judges" with play-count stats |
| **Sun 6–9 AM** | Sleep shifts + rehearse until three identical runs |

Devpost checkboxes: track = **Games & Gamification** (one track max). Challenges:
**ElevenLabs**, **Notability** (wireframe the table in it tonight — zero code),
**Tiger Data** only if the events table actually ships, MLH categories you truly
used. Domain prize if confirmed in the lineup.

---

## 8. Demo (2 min) — judge is the player

1. **0:00** — "Job scam losses went from $90M to $501M in four years. Median victim
   in Q4 last year: $2,000. The fastest-growing scam in America targets exactly the
   people in this room."
2. **0:20** — Deal case-01. Judge opens the email. "Looks great, right? Now — the
   offer says call to confirm." **Judge takes the live call.** Let the agent charm
   them for ~30 seconds.
3. **1:00** — "Verify it however you want." Judge either calls the email's number
   (in-band, red pip) or finds the directory (out-of-band, brass pip). Either path
   is a great demo.
4. **1:25** — Verdict chips → **the Receipt**. Read their chain out loud.
5. **1:45** — Leaderboard: "127 people at this hackathon played Casey last night.
   61% got fooled by this exact case." Close: "Casey works cases. Thanks — questions."

Q&A bullets: *"Isn't this security training?"* — training tells you rules; Casey
makes you practice the one skill (independent verification) against an adversary
who talks back, and the room's own fool-rate shows the rules weren't enough.
*"What stops the AI going off-script?"* — the case file is a fence: assertable
facts are enumerated, the truth and scoring never touch the model, and here's the
same case replayed with a different conversation and an identical receipt.

---

## 9. Hard rules

- Fictional organizations only. No real brands, no Rice, no real people.
- The agent never explains or invents scam techniques — it performs a fenced
  character, and the debrief screen does the teaching with real FTC links.
- Truth and scoring are code, never model output.
- After Sat 9 PM the answer to every new feature is no.

## 10. Do not build

Accounts/auth · a CMS for cases · AI-generated emails · multiplayer ·
mobile app · more than 3 cases · difficulty settings · achievements ·
anything for the scammer's side of the phone.
