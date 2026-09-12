# Casey — Game, Experience, and Build Design

**Take the call. Build the proof.**

HackRice 16 · Games & Gamification · ElevenLabs challenge

Canonical scope: [PROJECT.md](PROJECT.md)

> Casey is a voice-first investigation game where a persuasive caller wants the
> player to trust an offer. The player wins by building a defensible Trust Chain—not
> merely by guessing “scam.”

## 1. Product decision

### The sharp idea

Most scam education asks people to spot suspicious wording. Casey teaches a harder and
more transferable skill: **trace a claim to its source and verify it through a source the
claimant does not control**.

A phone call is not automatically independent of an email. If the phone number came from
that email, both artifacts share one source root. Casey makes that dependency visible.

### Player fantasy

You are a case investigator at a casino-style evidence table. A caller is trying to close
the deal. You can talk, inspect, cross-check, and pin only the evidence you are willing to
stand behind. When you commit a verdict, the table reveals the real trust graph.

### Intended emotional arc

`Curiosity → social pressure → doubt → deliberate investigation → commitment → reveal`

The “aha” moment is not that the offer contained a typo. It is seeing two apparent
confirmations collapse into one claimant-controlled branch.

### Positioning

**One sentence:** Casey turns “verify independently” from advice into a tense two-minute
skill players can practice.

**Judge opener:** “Most security training asks whether a message looks suspicious. Casey
asks whether your proof is actually independent.”

**Do not call it:** an AI scam detector, phishing quiz, cybersecurity chatbot, or
simulation platform. Those descriptions erase the original mechanic.

## 2. Competition strategy

The team’s HackRice 16 handbook names five judging criteria: Technical Rigor,
Originality & Creativity, User Experience & Design, Practicality & Impact, and
Relevance. The [official event site](https://hackrice.com/) confirms the event dates,
casino/card theme, and Games & Gamification track.

- Enter **Games & Gamification only**; the handbook permits at most one track.
- Submit to **Best Project Built with ElevenLabs**.
- Use the card/casino metaphor coherently. Confirm the official event theme before
  making a theme-prize claim.
- Notability is optional and counts only if the team genuinely uses it for sketches,
  playtest notes, or wireframes and can show that process.
- Lilie Lab is Rice-only. Do not claim eligibility unless every relevant rule is met.
- Tiger Data is not listed in this handbook; remove it from the plan.
- The required Devpost video is 3–4 minutes. Live judging is 2 minutes of demo plus
  1 minute of Q&A, repeated 3–4 times.

Detailed scoring strategy: [JUDGING.md](JUDGING.md).

## 3. Game loop

### Round structure

1. **Deal** — a two-sentence briefing and initial artifact arrive.
2. **Talk** — the player accepts a fictional live call or chooses fallback mode.
3. **Investigate** — actions reveal artifacts with different channels and source roots.
4. **Pin** — the player adds up to three artifacts to the Trust Chain.
5. **Commit** — Scam, Legitimate, or Not enough evidence.
6. **Receipt** — the game reveals source paths, pressure tactics, truth, score, and the
   transferable action.
7. **Replay** — a different truth state tests whether the player learned the mechanic.

### Why each choice matters

- Merely opening an artifact never counts as proof.
- The three-pin limit forces the player to select, not collect.
- A supplied phone number is convenient but remains claimant-rooted.
- An official directory found independently costs one more action but can break the
  claimant's trust chain.
- The game never rewards speed. Social pressure creates tension; patience creates safety.
- The correct verdict changes by case, so “always pick scam” is not a strategy.

### Focus and composure

Avoid a countdown timer. A timer would reward the unsafe behavior Casey is trying to
change. Instead:

- **Focus:** a presentation layer showing that the player has three evidence slots.
- **Composure:** a score dimension reduced only by authored unsafe choices, such as
  choosing “send the fictional ID form” before independent verification.
- Talking longer has no penalty.

### Pressure cards

During the live call, the ElevenLabs character may invoke an allowlisted client tool:

`dealPressureCard({ tactic: 'urgency' | 'authority' | 'scarcity' | 'reciprocity' })`

The UI deals a card face-down. It does not reveal the tactic during the call and does not
change the score. In the Receipt, each card flips and pairs a short quote/summary from the
authored tactic with a counter-action.

This creates three benefits:

1. voice visibly changes the game board;
2. the reveal makes an invisible persuasion pattern legible; and
3. model behavior remains outside deterministic truth and scoring.

Tool names and parameter names are case-sensitive and must exactly match the ElevenLabs
configuration. Reject unknown tactics rather than rendering model-supplied text.

## 4. Cases

All names, organizations, domains, phone numbers, and people are fictional. Evidence is
authored and deterministic.

### Case 01 — The Meridian Offer

**Truth:** Scam

**Purpose:** polished judge demo

**Briefing:** A student receives a well-paid research-assistant offer from “Meridian
Research Group” at fictional Harlow University. The caller says the position must be
accepted today.

Key paths:

| Player action | Channel | Source root | Class | Result |
|---|---|---|---|---|
| Open the offer email | Email | Meridian claimant | Claimant | Polished offer, urgency, supplied contact details |
| Call the number in the email | Phone | Meridian claimant | Claimant | Same persuasive character in a new medium |
| Open the “staff page” linked by the email | Web | Meridian claimant | Claimant | Convincing but claimant-controlled corroboration |
| Find Harlow's directory | Directory | Harlow University | Independent | Different official contact route |
| Call the directory number | Phone | Harlow University | Independent | Professor confirms there is no Meridian program |

The ideal Receipt collapses the first three artifacts into one red source branch and
shows the directory route as a separate gold branch.

Caller boundaries:

- Warm, confident, mildly rushed; replies under 25 words.
- May discuss only authored offer facts.
- May use the four allowed pressure tactics.
- Must not request real information, money, credentials, banking details, IDs, or secrets.
- If confronted with the authored directory contradiction, use the fixed crack line and
  end the call.

### Case 02 — The Awkward Refund

**Truth:** Legitimate

**Purpose:** prove calibrated trust and replay value

**Briefing:** A fictional bursar email says a duplicate campus fee will be returned. The
wording is awkward, but the message contains no payment link and asks the student to
verify through the official portal.

Independent evidence:

- the fictional campus portal shows the same credit;
- the directory-listed bursar number confirms the reference number;
- the caller refuses to collect bank details and directs the player back to the portal.

The case should contain superficial red flags but a clean independent chain. A player who
learned “suspicious-looking means scam” should lose; a player who learned verification
should win.

### Case 03 — The Sublet

**Truth:** Not enough evidence

**Priority:** P2

**Purpose:** reward restraint

**Briefing:** A plausible sublet offer has inconsistent details. The available evidence
neither independently confirms ownership nor proves deception.

No decisive artifact exists. The highest possible defensible outcome is Not enough
evidence plus the debrief action: verify ownership and tour before sending money.

## 5. Scoring

The score is deterministic, explainable, and capped at 1,000.

| Dimension | Max | Exact intent |
|---|---:|---|
| Verdict | 400 | Correct case outcome |
| Independence | 300 | Decisive, pinned artifact comes from an independent source root |
| Evidence quality | 200 | Pinned artifacts support the selected verdict |
| Composure | 100 | Player avoided explicitly unsafe authored actions |

### Rules

- `verdict = 400` when selected outcome equals case truth; otherwise `0`.
- `independence = 300` when at least one pinned artifact is both independent and
  decisive for the selected outcome. When `not_enough_evidence` is correct, award 300
  after the player attempts an authored independent check and its result remains
  non-decisive. Award `150` for independent but merely corroborative evidence;
  otherwise `0`.
- Each artifact has an authored `evidenceWeight` from 0–100 and `supports` outcomes.
  Evidence quality is the supporting pinned weight, minus 50 for each pinned artifact
  that directly contradicts the verdict, clamped to 0–200.
- Composure begins at 100 and subtracts each authored action's `riskCost`, clamped at 0.
- Elapsed time, transcript content, model confidence, pressure cards, and number of words
  spoken never affect points.
- Empty evidence can still produce a lucky correct verdict, but at most 500/1,000.

### Receipt copy rules

Use specific explanations, never a generic “correct/incorrect” modal:

- Claimant-only chain: **“Three confirmations. One source.”**
- Independent decisive proof: **“You left their channel and found a source they did not
  control.”**
- Correct guess without proof: **“Right verdict, weak chain. In real life, a guess is not
  protection.”**
- Legitimate outcome: **“Trust was earned through an independent route—not assumed from
  polish.”**
- Unresolved outcome: **“Stopping is a valid verdict when proof is missing.”**

## 6. Data contract

The exact implementation may use a schema validator, but the domain model must preserve
these semantics:

```ts
type Verdict = 'scam' | 'legit' | 'not_enough_evidence';
type Channel = 'email' | 'phone' | 'directory' | 'web' | 'portal';
type SourceClass = 'claimant' | 'independent' | 'unknown';
type PressureTactic = 'urgency' | 'authority' | 'scarcity' | 'reciprocity';

type CaseFile = {
  id: string;
  title: string;
  truth: Verdict;
  claimantSourceRoot: string;
  briefing: string;
  artifacts: Artifact[];
  actions: Action[];
  allowedPressureTactics: PressureTactic[];
  caller?: CallerConfig;
  debrief: {
    lesson: string;
    realWorldAction: string;
    sourceUrl: string;
  };
};

type Artifact = {
  id: string;
  title: string;
  channel: Channel;
  sourceRoot: string;
  sourceClass: SourceClass;
  content: string;
  supports: Verdict[];
  contradicts?: Verdict[];
  evidenceWeight: 0 | 25 | 50 | 75 | 100;
  decisive: boolean;
  unlockedBy?: string;
};

type Action = {
  id: string;
  label: string;
  type: 'open' | 'call' | 'lookup' | 'submit';
  sourceRoot: string;
  sourceClass: SourceClass;
  reveals: string[];
  riskCost: 0 | 25 | 50 | 100;
};

type CallerConfig = {
  persona: string;
  firstMessage: string;
  allowedFacts: string[];
  forbiddenRequests: string[];
  crackLine: string;
  maxCallSeconds: number;
};

type GameSession = {
  caseId: string;
  mode: 'live_voice' | 'text_fallback' | 'recorded_fallback';
  revealedArtifactIds: string[];
  actionIds: string[];
  pinnedArtifactIds: string[]; // max 3
  pressureTactics: PressureTactic[];
  verdict?: Verdict;
};
```

### Validation invariants

- IDs are unique and every reference resolves.
- Every case has exactly one truth value and at least one achievable defensible path.
- Case 01 has an independent decisive artifact reachable from an initial action.
- A `not_enough_evidence` case has a reachable independent check whose authored result
  remains non-decisive, so restraint can earn the full independence score.
- No case requires model output to reveal decisive evidence.
- Artifact content and source URLs contain only approved fictional scenario data, except
  vetted educational links in the debrief.
- Pressure tactics are a strict enum; the caller cannot inject display text.
- No action reduces composure merely for taking time or seeking more evidence.
- Pin count never exceeds three.

## 7. Experience design

### Visual language: the evidence table

The whole game is viewed from above on a casino-style felt table. Artifacts are cream
cards. Source roots are represented by small labeled seals, so channel and ownership are
visually distinct.

The current prototype and supplied brand art establish these canonical tokens:

```css
--felt:      #356A50;
--felt-deep: #2A5440;
--cream:     #F5EFE0;
--cream-dim: #E8E0CE;
--ink:       #252121;
--danger:    #B9342B;
--gold:      #CF9C2D;
```

These values match `app/globals.css`. Test the actual component combinations for WCAG
contrast; a palette token is not permission to use every foreground/background pairing.

### Type

- Display: **Playfair Display**, currently loaded through `next/font`.
- UI/body: **Public Sans**, currently loaded through `next/font`.
- Compact labels: **Jost**, used sparingly for short metadata—not paragraph copy.
- System fallbacks must preserve legibility if font loading fails.
- Sentence case for controls; reserve uppercase for short decorative card indices.
- The illustrated Casey wordmark is an image asset, not a UI font; provide meaningful
  adjacent text or alt text wherever it appears.

### Meaning system

Two properties must never be conflated:

- **Channel pip:** envelope, phone, directory, web, or portal icon.
- **Source seal:** claimant, independent, or unknown, always with a text label.

Red marks claimant-rooted evidence, gold marks independently rooted evidence, and a
neutral hatch marks unknown provenance. Color is always paired with icon and text.

### Screen 1 — Landing/onboarding

Primary content:

- Casey mark and “Take the call. Build the proof.”
- One rule: **“Before your verdict, pin the evidence you trust. A new channel is not
  always a new source.”**
- Primary button: **Deal the case**
- Secondary: **How to play** opens a three-card, dismissible explanation.

No statistics wall, signup, leaderboard, or microphone prompt on landing.

### Screen 2 — Briefing and consent

- Two-sentence briefing; no long narrative.
- Show call modes before requesting browser permission:
  - **Use microphone** — “Your voice is processed by ElevenLabs for this fictional call.
    Do not share real personal information.”
  - **Play without microphone** — full game with text/prerecorded call.
- Request permission only after the player chooses the microphone path.
- Permission denial changes mode without blame or dead end.

### Screen 3 — The table

Desktop zones:

```text
┌───────────────────────────────────────────────────────────────┐
│ Case + status                      Score preview / Help       │
│                                                               │
│  Artifact hand             Live call / pressure pile          │
│  [email] [web] [dir]       [caller state] [face-down cards]   │
│                                                               │
│  Trust Chain: [pin 1] → [pin 2] → [pin 3]                    │
│  Actions: [supplied number] [find directory] [official call]  │
│                                     [Choose verdict]          │
└───────────────────────────────────────────────────────────────┘
```

Mobile order:

1. case/status;
2. live call controls;
3. Trust Chain slots;
4. artifacts;
5. investigation actions;
6. sticky verdict button.

Artifacts open in a focus-trapped dialog or sheet and return focus to their originating
card. Pin/unpin is an explicit labeled button. Do not make card-flip gestures the only
way to access content.

### Call states

Every state has visible text:

`Ready → Requesting microphone → Connecting → Listening ↔ Speaking → Reconnecting → Ended`

At timeout/error:

`Live call unavailable → Continue with text call`

Include end-call, mute, volume, and captions/transcript controls. The player can continue
investigating while the call is active.

### Verdict

Three large labeled chips:

- Scam
- Legitimate
- Not enough evidence

Selecting a chip opens a confirmation tray showing the current pinned chain and:
**“Lock this verdict?”** This prevents an accidental tap from ending the round.

### Receipt

The Receipt is the visual climax:

1. pinned cards slide into an ordered chain;
2. connectors trace each card to its source root;
3. same-root branches collapse together;
4. pressure cards flip;
5. truth and four score dimensions appear;
6. one real-world action closes the screen.

Primary button: **Try another case**. Secondary: **Replay this case**. Sharing or
leaderboard placement is optional and must never block learning feedback.

### Motion and sound

- One 400–600 ms staggered deal on case entry.
- Pressure card appears only when the caller/tool acts.
- Receipt reveal may use one short sequence under 1.2 seconds.
- `prefers-reduced-motion` replaces transforms with immediate opacity/state changes.
- No autoplay before user interaction; no essential information in sound alone.

## 8. Technical design

### Target layout

```text
app/
  page.tsx
  play/[caseId]/page.tsx
  api/voice-session/route.ts
components/
  game/
    CardTable.tsx
    ArtifactCard.tsx
    TrustChain.tsx
    InvestigationActions.tsx
    VerdictTray.tsx
    Receipt.tsx
  voice/
    CallPanel.tsx
    CallConsent.tsx
lib/
  cases/
    schema.ts
    case-01.ts
    case-02.ts
  engine/
    reducer.ts
    score.ts
    receipt.ts
    validate-case.ts
  voice/
    build-init-data.ts
    pressure-tactics.ts
public/
  fallback/
    case-01-call.*
tests/
  engine/
  e2e/
```

### Current implementation snapshot

- The root package is the Casey Next.js application.
- `app/page.tsx` is an `ArtifactCard`/`Pip` isolation review, not the landing screen.
- The CSS palette, typography, logo assets, channel primitives, and artifact-card shell
  exist.
- The current `Band`-colored channel pip is prototype shorthand. Before game use, split
  channel identity from `sourceClass`/`sourceRoot` so a new medium never implies an
  independent source.
- Case fixtures, the pure engine, Trust Chain, Receipt, voice route, fallback, and tests
  do not exist yet.

Build forward from this prototype; do not re-scaffold the app or describe the isolation
page as a playable round.

### System boundary

```text
Typed case data ──→ pure engine ──→ React table ──→ Receipt
       │                                  ↑
       └─ safe caller variables ─→ ElevenLabs agent
                                         │
                         allowlisted pressure-card client tool
```

Only authored case data and player actions determine the upper path. ElevenLabs enriches
the call and can add explanatory pressure cards, but it cannot mutate truth, evidence
weights, or score.

### Voice integration

Use the current official `@elevenlabs/react` API verified at implementation time.
The current documentation provides a `ConversationProvider`, granular hooks, a
`useConversation` convenience hook, protected-agent authorization, dynamic variables,
and client tools.

Required flow:

1. Explain microphone processing and get an explicit player choice.
2. Browser requests microphone permission.
3. Browser calls `/api/voice-session`.
4. Server uses `ELEVENLABS_API_KEY` and an allowlisted agent ID to obtain short-lived
   provider authorization.
5. Browser starts the session with case variables selected from a server allowlist.
6. Agent may call `dealPressureCard`; client validates the enum and de-duplicates it.
7. UI displays connection/speaking/listening state and keeps an end-call escape.
8. On error or timeout, end the live session and switch to labeled fallback mode.

Do not forward arbitrary browser prompt text or case JSON into an agent override.
Browser-passed variables are inspectable and modifiable, so they are context—not secrets,
authorization, or trusted game state.

Official references:

- [React SDK](https://elevenlabs.io/docs/eleven-agents/libraries/react)
- [Agent authentication](https://elevenlabs.io/docs/eleven-agents/customization/authentication)
- [Dynamic variables](https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables)
- [Client tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools)

Step-by-step Casey configuration:
[ElevenLabs Creator setup runbook](ELEVENLABS.md).

### Agent prompt contract

```text
You are a fictional character in a scam-awareness investigation game.

CASE: {{case_title}}
CHARACTER: {{persona}}
ALLOWED FACTS: {{allowed_facts}}
FIXED CONTRADICTION: {{contradiction}}
FIXED EXIT LINE: {{crack_line}}

Stay in character and keep each reply under 25 words.
Use only the allowed facts. Do not invent organizations, URLs, phone numbers,
credentials, payment instructions, or personal details.
Never request real money, passwords, security codes, government IDs, banking data,
addresses, dates of birth, or other real personal information.
Never imitate a real person or claim this is a real organization.

You may apply only the allowed bounded pressure tactics. Before using one for the
first time, call dealPressureCard with its exact enum. Do not call any other client tool.

If the player states the fixed contradiction, say the fixed exit line and end naturally.
If asked to leave the scenario, explain that this is a fictional training call and stop.
```

The final production prompt must be tested against off-script questions, attempts to make
it request personal data, prompt injection spoken into the microphone, and repeated tool
calls.

### Fallback contract

Fallback is a supported mode, not a blank error state.

- **Text fallback:** preferred. Uses authored caller beats and the same visible call UI.
- **Recorded fallback:** one polished fictional call stored locally; disclose “demo
  recording” in the status.
- Both modes deal the same authored pressure cards at deterministic beats.
- The player still investigates, pins evidence, chooses a verdict, and receives the same
  deterministic Receipt.
- Before judging, warm the live route and keep fallback one click away.

### State and persistence

- Use a reducer or small store with serializable events.
- Do not make network calls inside the pure engine.
- Persist current local progress only if it costs little.
- A leaderboard/database is P2 and may store only nickname, score, case ID, mode, and
  timestamp. Reject or normalize unsafe nicknames.
- Never store raw audio or full transcripts in the Casey datastore.

## 9. Privacy, safety, and fairness

- All scenarios are fictional and clearly disclosed before play.
- Do not use real university, company, employee, or student identities.
- Do not clone or imitate a real person's voice.
- Tell players when ElevenLabs processes microphone audio and provide a no-mic path.
- Tell players not to share real personal information; the caller is forbidden from
  requesting it.
- Configure provider retention to the minimum available and describe actual behavior;
  never promise deletion that has not been verified.
- No model-generated links, phone numbers, evidence, case truth, or debrief advice.
- The agent's tool output is untrusted and allowlisted.
- The player may end the call immediately and still finish the case.
- A legitimate case prevents the game from equating accent, grammar, or unfamiliarity
  with maliciousness.

## 10. Impact and validation

Use one sourced claim in the pitch: FTC-reported losses to job and employment-agency
scams increased from $90 million in 2020 to $501 million in 2024
([FTC](https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024)).

Do not claim that Casey reduces losses from a weekend test. The honest near-term measure
is comprehension and behavior inside the game.

### Five-person test

Test Case 01 with people who did not help design it. Do not coach during play. Record:

- understood objective after onboarding: yes/no;
- completion time;
- used an independent route before verdict: yes/no;
- could explain new channel vs independent source afterward: yes/no;
- one moment of confusion;
- one spontaneous fun/replay comment, if any.

Target:

- at least 4/5 understand the objective;
- at least 4/5 complete within two minutes;
- at least 4/5 explain the source-root lesson afterward.

If a target fails, change onboarding or mechanics before adding features. Report results
with `n=5`; never inflate or generalize them.

### Scalable path

After the hackathon, Casey can become an authorable scenario library for universities,
career centers, banks, and community organizations. The scalable unit is the validated
case file plus bounded caller configuration—not a free-form model that invents training.

## 11. Build order

Work through these gates in order. The visual prototype is a starting point, not a
completed gate.

### Gate A — deterministic vertical slice

- Keep the existing Next.js scaffold and align new modules to the target layout above.
- Define and validate one Case 01 fixture.
- Implement reducer, pin limit, score, and Receipt explanation keys with tests.
- Render an unstyled path from Deal to Receipt.

**Exit:** Case 01 completes locally with voice mocked and deterministic tests green.

### Gate B — experience

- Apply tokens and responsive table layout.
- Implement artifact dialog, Trust Chain, actions, verdict confirmation, and Receipt.
- Add keyboard, focus, reduced-motion, and 390 px behavior.

**Exit:** a first-time player can finish without explanation; fallback call is usable.

### Gate C — ElevenLabs

- Configure one protected fictional agent.
- Add server-side session authorization.
- Pass static case variables.
- Register and validate the pressure-card client tool.
- Add statuses, consent, timeouts, hang-up, and automatic fallback.

**Exit:** deployed live call changes the board and failure still completes the round.

### Gate D — depth and proof

- Run five-person test and fix the highest-friction issue.
- Add Case 02 if all prior exits are green.
- Add anonymous aggregates/leaderboard only if it cannot threaten the demo.
- Capture screenshots and a fallback recording.

**Exit:** every 9+ evidence gate in the judging audit has a real artifact or an honest gap.

### Freeze

- Freeze features before the final overnight period.
- Walk the deployed demo with console open.
- Verify production environment variables.
- Record the mandatory 3–4 minute video.
- Rehearse the 2-minute demo and 1-minute Q&A at least three times.

## 12. Demo scripts

### Live judging — 2 minutes

**0:00–0:15 — Thesis**

“Most scam training asks whether a message looks suspicious. Casey asks whether your
proof is actually independent. Take this research-job call.”

**0:15–0:50 — Voice pressure**

Deal Case 01. Let the judge accept the call and ask one question. A pressure card appears
face-down when the caller uses an allowed tactic.

**0:50–1:20 — Agency**

“Now verify it however you want.” Let the judge choose the supplied number or the
independent directory route, then pin evidence.

**1:20–1:45 — Commitment and reveal**

Judge locks a verdict. The Receipt collapses email, linked page, and supplied number to
one claimant root, then flips pressure cards.

**1:45–2:00 — Close**

“Casey doesn't train paranoia. The next case is legitimate. It trains one habit: leave
the claimant's channel and build proof they don't control.”

### Q&A — 1 minute

- **Why AI?** The caller adapts to the player's questions and changes the visible board;
  deterministic case data still controls fairness.
- **Why a game?** The player has constrained evidence slots, branching actions, three
  truth states, explainable scoring, mastery, and replay.
- **What is technically difficult?** Low-latency live voice, safe per-case
  personalization, client-tool state changes, deterministic source-graph evaluation, and
  graceful failure in one browser experience.
- **What about safety?** Fictional identities, bounded facts/tactics, no real-data
  requests, short-lived authorization, allowlisted tools, and a no-mic path.
- **Does it work?** Give only measured playtest results with sample size, then demonstrate
  fallback if asked.

### Devpost video — 3–4 minutes

Follow the handbook's recommended structure:

1. 30 seconds — team, Casey, Games & Gamification, ElevenLabs, problem and thesis.
2. 2 minutes — uninterrupted demo path ending on the Receipt.
3. 30 seconds — system boundary: deterministic engine vs adaptive voice layer.
4. 30 seconds — sourced impact, playtest results with sample size, and validated case-pack
   expansion.

Never use future-tense usage metrics as if they already happened.

## 13. Release checklist

### Product

- [ ] Case 01 works end to end in under two minutes.
- [ ] Player pins evidence; opening everything is not a winning shortcut.
- [ ] Same-channel artifacts visibly collapse to one source.
- [ ] All verdict labels are plain language.
- [ ] Receipt explains the result and one real-world action.
- [ ] Case 02 exists only if Case 01 is polished and resilient.

### Technical

- [ ] Exact dependencies are pinned and current APIs verified.
- [ ] Case validation and score tests pass.
- [ ] Browser demo-path test passes.
- [ ] No client bundle or log exposes secrets.
- [ ] Client-tool arguments are allowlisted and de-duplicated.
- [ ] Model output cannot change truth, weights, unlocks, or score.
- [ ] Production build and deployed route are green.

### Voice and failure

- [ ] Consent precedes microphone permission.
- [ ] Connection, listening, speaking, ended, and fallback states are visible.
- [ ] Player can mute and end immediately.
- [ ] Live voice deals at least one pressure card.
- [ ] Mic denial, API error, timeout, and lost network all reach fallback.
- [ ] Local fallback asset/text is present and labeled.

### UX and accessibility

- [ ] 390 px layout works with no hidden actions.
- [ ] Entire round is keyboard-completable.
- [ ] Focus is visible and restored after dialogs.
- [ ] Reduced motion and captions/text path work.
- [ ] Meaning never relies on color, motion, or sound alone.
- [ ] Five-person test meets or records gaps against the 4/5 targets.

### Submission

- [ ] One track selected: Games & Gamification.
- [ ] ElevenLabs challenge use is accurately described.
- [ ] Any other challenge claim is verified and evidenced.
- [ ] 3–4 minute video uploaded before Sunday 9:00 AM CT.
- [ ] Backup video, screenshots, and live fallback are ready.
- [ ] Two-minute demo and one-minute Q&A are rehearsed.

## 14. Final cut list

Do not build accounts, auth, a CMS, multiplayer, a mobile app, open web search, real
calls, payments, AI-generated evidence, a fourth case, or any sponsor integration that
does not deepen the core mechanic.

If time is short, cut in this order:

1. leaderboard and remote telemetry;
2. Case 03;
3. Case 02 presentation polish, keeping its fixture/test if possible;
4. nonessential animation and audio;
5. landing-page decoration.

Never cut the deterministic Receipt, the Trust Chain, fallback play, consent, or the
ability to complete Case 01.
