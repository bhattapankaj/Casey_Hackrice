# Casey — Product Contract

> Canonical source for scope and product behavior. Put environment-variable names here,
> never values. If another planning document conflicts with this file, this file wins.

## Status

- **Phase:** Case 01 vertical slice implemented; local live voice verified; Tiger Data
  readiness scaffolded but not connected; dashboard-tool, deployed-HTTPS, provider
  retention, database, and human-playtest gates remain
- **Event:** HackRice 16
- **Deadline:** Sunday, September 13, 2026 at 9:00 AM CT
- **Judging:** 3 minutes total—2-minute demo, 1-minute Q&A; repeated 3–4 times
- **Submission:** mandatory 3–4 minute Devpost video
- **Track:** Games & Gamification (one track maximum)
- **Primary challenge:** Best Use of ElevenLabs
- **Secondary challenge:** Best Use of Tiger Data, only after a real privacy-minimized
  analytics path is deployed and demonstrated

## Idea

Casey is a voice-first social-engineering investigation game. The player receives a
convincing opportunity, speaks with an adaptive fictional caller, and investigates the
claim. Before choosing **Scam**, **Legitimate**, or **Not enough evidence**, the player
must pin up to three artifacts into a Trust Chain. The Receipt then reveals whether
those confirmations were actually independent or all traced back to the same claimant.

**One sentence:** Casey turns “verify independently” from advice into a tense,
two-minute skill players can practice.

**Player:** a student or early-career job seeker accustomed to email, texts, calls, and
online directories.

**Problem:** warning lists are easy to agree with after the fact; the difficult moment is
noticing that two convincing confirmations share one source while a persuasive person is
applying pressure.

**Why now:** realistic, low-latency voice agents make the social part of the scenario
interactive instead of scripted. FTC data also shows job-scam harm is substantial:
reported losses for job and employment-agency scams increased from $90 million in 2020
to $501 million in 2024 ([FTC](https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024)).

## Goal

Build the most memorable two-minute experience in the Games & Gamification field and a
credible ElevenLabs challenge entry. “9+/10” is an internal evidence bar, not a promised
judge score. We earn it only if the live build satisfies every acceptance gate in
[the judging audit](JUDGING.md).

### Success signals

- A first-time player can explain the objective after the onboarding without coaching.
- At least 4 of 5 paper/playtest participants finish Case 01 in two minutes.
- At least 4 of 5 understand why two same-source confirmations are not independent.
- The live call changes the visible game state through pressure cards.
- The complete round remains playable if microphone permission or ElevenLabs fails.
- No invented metrics appear in the demo, Devpost entry, or UI.

## Demo path

1. Landing: judge enters the required local player name, reads “Take the call. Build the
   proof.”, and selects **Deal the case**.
2. Briefing: two sentences establish a fictional research-job offer; the table deals the
   email, phone, and directory actions.
3. Consent: judge chooses **Answer with microphone** or **Use text instead** after a clear
   processing/privacy notice.
4. Call: the ElevenLabs character responds in short turns and deals face-down pressure
   cards through an allowlisted client tool.
5. Investigate: judge chooses a supplied route, an independently sourced route, or both;
   the presenter does not coach the choice.
6. Build proof: judge pins up to three artifacts into the Trust Chain.
7. Verdict: judge chooses Scam, Legitimate, or Not enough evidence and confirms.
8. Receipt: Casey flips pressure cards and maps each pinned artifact to its source root,
   then shows truth, four-part score, and one real-world action.

The path must fit within two minutes without relying on a leaderboard, database, or a
second case.

## Game contract

### Core loop

`Deal → Talk → Investigate → Pin evidence → Commit verdict → Read Receipt → Replay`

### Deterministic score (1,000 points)

| Dimension | Points | Rule |
|---|---:|---|
| Verdict | 400 | Selected verdict matches case truth |
| Independence | 300 | Chain includes decisive independent evidence, or the player independently verifies that the case remains unresolved |
| Evidence quality | 200 | Up to three pinned artifacts support the selected verdict according to case data |
| Composure | 100 | Player avoids authored unsafe actions; elapsed time is irrelevant |

A correct guess with weak proof must score lower than a supported verdict. Never infer
points from free-form conversation or model output.

### Required outcomes

- Case 01: `scam` — **The Meridian Offer**
- Case 02: `legit` — suspicious presentation, independently verifiable source
- Case 03/P2: `not_enough_evidence` — insufficient evidence makes restraint correct

## Scope

### Must demo

- 15-second onboarding and responsive card-table UI
- Case 01 artifact/action graph
- Evidence pin/unpin with source-root display
- Three verdicts, deterministic scoring, and Receipt
- ElevenLabs voice call, mic consent, call status, and hang-up control
- Face-down pressure-card client tool with strict enum validation
- Text or prerecorded fallback using the same case and Receipt
- Keyboard, visible focus, captions/transcript, reduced motion, 390 px layout
- Unit-tested score evaluator and case-schema validator
- One automated end-to-end test for the demo path

### Should ship only after Must demo

- Case 02 to prove the game is not “always choose scam”
- Activate the prepared Tiger Data anonymous outcome telemetry and aggregate dashboard
- Leaderboard, only if it remains privacy-safe and demo-independent
- Case 03
- Notability process-challenge evidence, if genuinely used during ideation/testing

### Cut

- Accounts/auth, profiles, CMS, multiplayer, native mobile app
- AI-generated emails, case truth, evidence, or scoring
- Open web search inside the game, real phone calls, payment flows
- More than three cases, difficulty trees, inventory, or a story campaign
- Prize-driven integrations that do not deepen the Trust Chain lesson or produce real,
  demonstrable evidence

## Locked technical direction

| Layer | Decision |
|---|---|
| Web app | Next.js App Router + TypeScript; exact stable version pinned at scaffold time |
| Styling | Tailwind + CSS custom properties; no component-library dependency for core game UI |
| State | Reducer/store behind a typed engine adapter; select the smallest option during scaffold |
| Voice | ElevenLabs Agents via the official React SDK |
| Voice auth | Server-only endpoint returns a short-lived signed URL/token |
| Cases | Static typed JSON/TypeScript fixtures; schema validated |
| Truth and score | Pure deterministic TypeScript functions |
| Persistence | Local session first; optional Tiger Data anonymous outcomes are P2 |
| Deploy | Vercel, after local demo path is green |

Do not pin framework or SDK version numbers in prose. The lockfile is authoritative.

## Data model

- `CaseFile`: identity, truth, briefing, artifacts, actions, pressure deck, scoring rubric,
  and debrief.
- `Artifact`: channel, root source, independence class, content, claim tags, support
  direction, and unlock rule.
- `Action`: player label, safety class, source root, artifact reveals, and optional call
  configuration.
- `EvidencePin`: artifact ID and pin order; maximum three.
- `GameSession`: case ID, mode, revealed IDs, actions taken, pins, pressure cards, verdict,
  and timestamps.
- `PlayerProfile`: versioned browser-local JSON containing only the required player name.
- `ScoreReceipt`: deterministic dimension scores, explanation keys, and total.

The detailed contract lives in the build doc. One `sourceRoot` may produce artifacts in
multiple channels; this is how Casey distinguishes a new medium from an independent source.

## External services

| Service | Use | Secret names | Required for fallback? |
|---|---|---|---|
| ElevenLabs | Live fictional caller | `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` | No |
| Vercel | Deployment | configured in host | No for local play |
| Tiger Data | Optional anonymous outcome analytics only | `TIGER_DATABASE_URL` | No |

Official ElevenLabs references: [React SDK](https://elevenlabs.io/docs/eleven-agents/libraries/react),
[agent authentication](https://elevenlabs.io/docs/eleven-agents/customization/authentication),
and [dynamic variables](https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables).
Casey-specific configuration steps live in the
[ElevenLabs Creator setup runbook](ELEVENLABS.md).

## Constraints

- Follow the HackRice handbook, especially the one-track limit, mandatory video,
  submission deadline, and 2-minute live-demo format.
- Product code must be authored during the official hacking period. Only implemented,
  verified behavior may be represented as a Casey feature.
- Fictional organizations and identities only; no real-person voice imitation.
- Keep the required player name in browser storage only. Never send it to ElevenLabs,
  Tiger Data, server routes, transcripts, case data, logs, or scoring.
- Explain microphone use before requesting permission. Never ask for real personal data.
- Truth and score are never model-generated.
- External failure must not break the game or Receipt.
- Use measured results only. Record sample size next to every playtest or telemetry stat.

## Commands

Current commands are `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run test`,
`npm run build`, `npm run test:e2e`, `npm run check`, `npm run db:migrate`, and
`npm run db:verify`. Automated provider tests use mocks and consume no ElevenLabs
credits. A local real-agent WebRTC session was verified on September 12, 2026; the
deployed call, live pressure-tool callback, and Tiger Data schema/deployed analytics
remain manual gates.

## Glossary

- **Claimant:** the person or organization making the original claim.
- **Channel:** email, phone, directory, or web—the medium carrying an artifact.
- **Source root:** the underlying party that ultimately controls an artifact.
- **Claimant-rooted / in-band:** evidence supplied by or controlled by the claimant,
  even when it arrives through a different channel.
- **Independent / out-of-band:** evidence reached through a separately discovered,
  trusted source root.
- **Trust Chain:** the player's ordered set of up to three pinned artifacts.
- **Pressure card:** a face-down record of a bounded persuasion tactic used by the caller.
- **Receipt:** the deterministic post-verdict explanation and score breakdown.
