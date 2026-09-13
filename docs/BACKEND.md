# Casey — Backend and Integration Plan

This document defines the implementation plan for Casey's domain logic, secure
ElevenLabs integration, and the minimum frontend wiring needed to connect them. It is
subordinate to [PROJECT.md](PROJECT.md), follows the game and scoring contract in
[BUILD.md](BUILD.md), and uses the provider configuration and safety rules in
[ELEVENLABS.md](ELEVENLABS.md).

The existing visual design is fixed. Backend work may change data flow, state ownership,
component props, and event handlers, but must not redesign the layout, typography,
colors, motion, or interaction styling.

## Implementation status — September 12, 2026

- Phases 1 and 2 are complete: Case 01 validates, the reducer and four-part score are
  pure, and the Receipt is deterministic and immutable.
- Phase 3 is complete for the must-demo path: the pulled frontend renders engine state,
  distinguishes viewed from pinned artifacts, caps the Trust Chain at three, and reaches
  the same Receipt through fallback.
- Phase 4 is complete in code and mocked tests: the thin route returns a fresh provider
  token, rejects invalid input/origins, rate-limits locally, times out, and sanitizes
  provider failures without exposing secrets.
- Phase 5 is complete in code: explicit consent, no-microphone fallback, SDK lifecycle,
  captions, cleanup, the 75-second limit, and `dealPressureCard` are wired. The protected
  agent dashboard, real credentials, deployed HTTPS call, and retention settings remain
  unverified manual gates.
- Automated Phase 6 checks pass locally. The five-person playtest has not been run and no
  participant results are claimed.
- Tiger Data readiness is scaffolded but inactive: server-only configuration, a lazy
  Postgres pool, a parameterized anonymous-outcome writer, a hypertable migration, and
  aggregate queries exist. No service connection, migration, deployed write, or frontend
  network call has been verified.

## Outcome

The backend slice is complete when a player can finish Case 01 through either live voice
or fallback mode, pin a defensible Trust Chain, commit one of three verdicts, and receive
a deterministic 1,000-point Receipt. The same case must remain playable when microphone
permission, the token endpoint, ElevenLabs, or the network fails.

The smallest demo-relevant acceptance path is:

1. Load **The Meridian Offer** from validated static case data.
2. Choose live microphone mode after consent, or choose the no-microphone fallback.
3. Investigate one claimant-rooted route and one independently found route.
4. Pin up to three revealed artifacts; merely opening an artifact does not pin it.
5. Commit a verdict once.
6. Generate the Receipt from case data and session events only.
7. Show truth, source paths, pressure tactics, the four score dimensions, total score,
   and one real-world action.

## Backend boundary

Casey does not need a conventional database-backed application server to complete the
demo. Its must-demo backend consists of:

- validated, authored case fixtures;
- a pure deterministic game engine;
- deterministic scoring and Receipt generation;
- safe case-to-agent variable construction;
- one server-only route that exchanges the ElevenLabs API key for a short-lived WebRTC
  conversation token; and
- a strict pressure-card allowlist shared with the frontend adapter.

An optional P2 Tiger Data boundary under `lib/db/**` can persist one anonymous completed
outcome and power aggregate learning signals. It is not imported by the frontend and
must never block the game, Receipt, or localStorage path. Setup and rollout are defined
in [TIGER_DATA.md](TIGER_DATA.md).

Use the existing top-level `lib/` directory as the dedicated backend/domain area. This
keeps all meaningful logic outside `app/` and `components/`, while preserving Casey's
required `lib/cases/**`, `lib/engine/**`, and `lib/voice/**` architecture. Next.js still
requires the HTTP entry point under `app/api`, so that route must be a thin adapter with
no domain or provider logic of its own.

```text
Validated case data ──→ pure game engine ──→ score + Receipt
         │                       ↑
         └─→ safe voice vars     │ pressure tactic enum only
                    │            │
Browser ──→ thin Next route ──→ ElevenLabs protected agent
```

ElevenLabs can add pressure-card events, but it cannot reveal evidence, determine truth,
change an evidence weight, or award points.

## Target file structure

```text
lib/
  cases/
    schema.ts                 # Runtime schema and exported case types
    case-01.ts                # The Meridian Offer fixture
    case-02.ts                # Deferred until Case 01 is green
    case-03.ts                # Deferred/P2
    registry.ts               # Allowlisted case lookup and enabled case order
    public-case.ts            # UI-safe selectors if needed
  engine/
    types.ts                  # Session, event, score, and Receipt types
    reducer.ts                # Pure session state transitions
    selectors.ts              # Revealed/pinned/action/source selectors
    score.ts                  # Pure 1,000-point evaluator
    receipt.ts                # Pure explanations and source graph
    validate-case.ts          # Cross-reference and semantic validation
  voice/
    types.ts                  # Voice status and provider response types
    env.server.ts             # Server-only environment access
    case-variables.ts         # Allowlisted dynamic-variable builder
    elevenlabs.server.ts      # Token API client with timeout and validation
    create-session.server.ts  # Request validation and safe response mapping
    pressure-tactics.ts       # Enum validation and authored display copy
    fallback.ts               # Authored text/prerecorded fallback beats
    rate-limit.server.ts      # Bounded local limiter adapter
  session/
    storage.ts                # Optional, versioned local-session persistence
  db/
    config.server.ts          # Optional server-only Tiger Data environment
    pool.server.ts            # Lazy bounded Postgres connection pool
    session-outcome.ts        # Deterministic privacy-minimized row builder
    outcomes.server.ts        # Parameterized insert adapter
hooks/
  useGameSession.ts           # React adapter over the pure reducer
  useCaseyVoice.ts            # React/ElevenLabs lifecycle adapter
app/
  api/
    voice-session/
      route.ts                # Thin POST adapter only
tests/
  cases/
  db/
  engine/
  voice/
  e2e/
```

Files that read `ELEVENLABS_API_KEY` must use a `.server.ts` suffix and import
`server-only`. Client components may import only shared types, the pressure-tactic
allowlist, and browser-safe functions.

## Current code migration

The current implementation is a visual prototype with partial client-side behavior. The
backend implementation must resolve these contract gaps without changing the design:

- `lib/cases.ts` uses `more` and `unresolvable`; migrate them to the canonical
  `not_enough_evidence` value.
- `lib/cases.ts` stores an `in`/`out` display band but not `sourceRoot` or
  `sourceClass`. Source provenance must become domain data; display bands become a final
  UI mapping only.
- `lib/cases/schema.ts` currently exports TypeScript shapes but does not perform runtime
  validation.
- `lib/scoring.ts` scores opened artifacts. It must be replaced because only pinned
  artifacts enter the Trust Chain.
- `components/CardTable.tsx` owns parallel arrays and booleans. Replace that state with
  the reducer adapter while preserving its existing markup and classes.
- `components/ArtifactViewer.tsx` currently simulates a call with a timer. Preserve the
  call card's presentation but wire its controls and status to the voice adapter.
- `components/Receipt.tsx` currently builds the score during render and updates storage
  in an effect. It must receive one already-built, immutable `ScoreReceipt`.
- The seeded leaderboard is not real telemetry. It must not be represented as player
  data; database-backed leaderboard work remains P2.

After imports are migrated, remove the duplicate root `lib/cases.ts`, `lib/scoring.ts`,
and old session behavior rather than keeping two sources of truth.

## Domain contract

### Canonical enums

```text
Verdict        = scam | legit | not_enough_evidence
Channel        = email | phone | directory | web | portal
SourceClass    = claimant | independent | unknown
PressureTactic = urgency | authority | scarcity | reciprocity
EvidenceWeight = 0 | 25 | 50 | 75 | 100
```

Channel and source independence are separate concepts. A phone artifact is not
independent merely because the original claim arrived by email.

### Case data

`CaseFile` must contain:

- ID, title, truth, briefing, and claimant source root;
- authored artifacts and investigation actions;
- allowed pressure tactics;
- optional caller configuration;
- scoring/debrief explanation keys and a real-world action; and
- no secret, real personal information, or model-generated evidence.

Each `Artifact` must include its channel, `sourceRoot`, `sourceClass`, content, support
and contradiction verdicts, evidence weight, decisive flag, and optional unlock action.

Each `Action` must include its source metadata, artifacts revealed, and authored
`riskCost`. Actions reveal evidence; opening the resulting artifact still does not pin
it.

### Case 01 source graph

Case 01 should use two underlying roots:

| Route | Channel | Source root | Class | Result |
|---|---|---|---|---|
| Original offer | Email | `meridian-claimant` | Claimant | Initial offer and supplied routes |
| Supplied number | Phone | `meridian-claimant` | Claimant | Same claimant in another medium |
| Supplied staff page | Web | `meridian-claimant` | Claimant | Claimant-controlled corroboration |
| Independently found directory | Directory | `harlow-university` | Independent | Trusted contact route |
| Directory-listed call | Phone | `harlow-university` | Independent | Decisive fixed contradiction |

This graph must make it impossible for the UI to infer independence from the channel.

### Runtime case validation

Validation runs in tests and when registering fixtures. Reject a case when:

- a case, artifact, or action ID is missing or duplicated;
- an unlock or reveal reference points to an unknown ID;
- an artifact has an invalid source class, channel, verdict, or evidence weight;
- a decisive artifact supports no verdict;
- an action has an unsupported `riskCost`;
- caller tactics are duplicated or outside the pressure enum;
- caller maximum duration exceeds the 75-second application limit;
- a debrief URL is not an approved HTTPS source;
- Case 01 lacks decisive independent evidence supporting `scam`; or
- a voice variable contains a secret, arbitrary user input, or score/truth instructions.

Do not weaken types or validation to make a fixture pass.

## Deterministic game engine

### Session state

`GameSession` stores only serializable state:

- `caseId`;
- mode: `live_voice`, `text_fallback`, or `recorded_fallback`;
- revealed artifact IDs;
- completed action IDs;
- ordered pinned artifact IDs, maximum three;
- dealt pressure tactics;
- committed verdict, if any; and
- timestamps supplied by events, never read directly inside the reducer.

Ephemeral provider state such as `connecting`, `speaking`, or microphone mute belongs in
the voice hook, not in the scoring model.

### Engine events

The reducer handles these events:

```text
START_CASE
SELECT_MODE
TAKE_ACTION
REVEAL_ARTIFACT
PIN_EVIDENCE
UNPIN_EVIDENCE
DEAL_PRESSURE_CARD
COMMIT_VERDICT
RESET_CASE
```

Reducer invariants:

- only known actions and artifacts are accepted;
- only revealed artifacts can be pinned;
- pin order is stable and duplicate pins are ignored;
- no more than three artifacts can be pinned;
- a pressure tactic must be allowlisted, unique, and one of at most three cards;
- pressure cards never unlock evidence or affect scoring;
- a verdict can be committed once; and
- scored game state cannot be mutated after commitment, except by a full reset.

The reducer is pure: no React, browser API, storage, network request, model call, clock,
or random value.

### Scoring

`scoreSession(caseFile, session)` returns four explicit dimensions:

| Dimension | Maximum | Rule |
|---|---:|---|
| Verdict | 400 | Selected verdict equals authored truth |
| Independence | 300 | Pinned decisive independent proof supports the verdict; 150 for independent corroboration |
| Evidence quality | 200 | Sum supporting pinned weights, minus 50 per directly contradictory pin, clamped to 0–200 |
| Composure | 100 | Start at 100 and subtract completed actions' authored risk costs, clamped at zero |

For a correct `not_enough_evidence` case, independence is 300 only after an authored
independent check was attempted and its result remained non-decisive. Elapsed time,
transcript text, model output, pressure cards, speaking duration, and number of opened
artifacts are excluded from scoring.

A correct verdict with no evidence therefore scores no more than 500: 400 verdict plus
100 composure.

### Receipt

`buildReceipt(caseFile, session, score)` returns an immutable `ScoreReceipt` containing:

- truth and selected verdict;
- each score dimension and explanation key;
- total out of 1,000;
- only the pinned artifacts, in pin order;
- pinned artifacts grouped by `sourceRoot` for the provenance graph;
- dealt pressure tactics mapped to authored explanations and counter-actions;
- lesson and real-world action; and
- no raw transcript or model-generated explanation.

Calling Receipt generation twice with identical inputs must return an identical value and
must not double-apply score or storage changes.

## ElevenLabs integration

### Environment

Local and deployment configuration uses only:

```dotenv
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
```

Neither variable receives a `NEXT_PUBLIC_` prefix. Validate non-empty values at request
time so production builds and fallback mode can still work without voice configuration.
Never validate by logging the values.

### Server token flow

`POST /api/voice-session` accepts exactly:

```json
{ "caseId": "case-01" }
```

It returns on success:

```json
{
  "conversationToken": "short-lived provider token",
  "conversationId": "provider conversation ID",
  "dynamicVariables": {
    "case_title": "The Meridian Offer",
    "character_name": "Morgan Vale",
    "organization_name": "Meridian Research Group",
    "persona": "...",
    "opening_line": "...",
    "scenario_summary": "...",
    "allowed_facts": "...",
    "contradiction": "...",
    "crack_line": "...",
    "allowed_tactics": "urgency, authority, scarcity, reciprocity"
  }
}
```

The route must never accept an agent ID, prompt, tool definition, arbitrary dynamic
variables, case object, truth, or score data from the browser. It builds variables only
from the server-owned case registry.

The provider request is:

```text
GET https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=<server agent ID>
xi-api-key: <server API key>
```

ElevenLabs currently returns `token` and `conversation_id` from this endpoint. Use a
fresh token for every call and never cache it. See the official
[WebRTC conversation-token API](https://elevenlabs.io/docs/eleven-agents/api-reference/conversations/get-webrtc-token).

### Route behavior

| Condition | Status | Safe result |
|---|---:|---|
| Invalid JSON, content type, or shape | 400 | `INVALID_REQUEST` |
| Unknown or disabled case | 400 | `UNKNOWN_CASE` |
| Cross-origin request | 403 | `FORBIDDEN` |
| Missing server configuration | 503 | `VOICE_NOT_CONFIGURED` |
| Local/platform rate limit exceeded | 429 | `RATE_LIMITED` plus `Retry-After` |
| Provider authentication/validation/failure | 502 | `VOICE_UNAVAILABLE` |
| Provider timeout | 504 | `VOICE_TIMEOUT` |
| Valid provider response | 200 | Token, conversation ID, and safe variables |

All responses use `Cache-Control: no-store, max-age=0`. The provider request has a short
abort timeout. Validate the provider response before reading fields. Return a generic
message to the browser and never forward the provider response body.

Logs may contain a generated request ID, allowlisted case ID, provider status class,
elapsed milliseconds, and internal error code. Logs must not contain the API key, token,
conversation ID, provider body, dynamic-variable contents, IP address, audio, or
transcript.

Use same-origin validation in code. Add a production Vercel route-level rate limit for
`/api/voice-session`; an in-memory limiter is acceptable only as bounded local defense
and must not be described as globally reliable in serverless deployment. Do not add a
database solely for rate limiting during the hackathon.

### Browser session adapter

Install the official `@elevenlabs/react` package and pin the resolved version through the
lockfile. The current SDK supports `ConversationProvider`, status/control hooks, and
`startSession({ conversationToken, dynamicVariables })` for a protected WebRTC session.
See the official [React SDK documentation](https://elevenlabs.io/docs/eleven-agents/libraries/react).

`useCaseyVoice` owns this lifecycle:

```text
idle
  → consent
  → requesting_microphone
  → requesting_token
  → connecting
  → connected.listening ↔ connected.speaking
  → ended

any live state
  → error
  → text_fallback
```

Rules:

- request microphone access only after the player selects **Use microphone**;
- start the 75-second hard timer only after the connection succeeds;
- end the session on hang-up, timeout, route change, case change, or unmount;
- expose mute, end, status, and caption data to the existing call card;
- treat transcript events as untrusted display-only text;
- do not send transcripts into the engine or store them;
- handle permission denial, token failure, provider errors, and network loss by entering
  fallback mode without resetting the investigation; and
- request a fresh token on replay.

### Pressure-card client tool

Register one exact client tool:

```text
dealPressureCard({ tactic: urgency | authority | scarcity | reciprocity })
```

The dashboard tool name and parameter name are case-sensitive, and **Wait for response**
must be enabled when the agent should wait for Casey's result. See the official
[client-tool documentation](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools).

The browser handler must:

1. treat the entire payload as `unknown`;
2. accept only an object with the single required string `tactic`;
3. reject an unknown value without rendering it;
4. let the reducer reject duplicate tactics or calls beyond three;
5. derive all visible copy from Casey's authored tactic map; and
6. return only a short success or rejection string to the agent.

Tool failure does not terminate the call and does not retry automatically. No other
client, webhook, MCP, code-execution, navigation, or server action tool is needed.

### Dynamic variables

Variable names must match the dashboard placeholders exactly and all Casey values remain
strings. Dynamic variables can shape the conversation, but browser-visible values are
not secrets or authorization and must never contain case truth or score rules. See the
official [dynamic-variable documentation](https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables).

### Fallback

`lib/voice/fallback.ts` contains authored caller beats for Case 01 and deterministic
pressure-card cues. Fallback mode uses the same case, reducer, pinning, verdict, score,
and Receipt. It must not be a dead-end error screen.

The preferred fallback is text. A local prerecorded call may be added after the text
path is green and must be labeled as a demo recording.

## Frontend wiring without redesign

The backend team may make these integration changes:

- Replace `CardTable`'s parallel `useState` values with `useGameSession` selectors and
  dispatch functions.
- Pass revealed state, pin state, and engine handlers into the existing artifact cards
  and viewer.
- Keep the visible **Need more evidence** label while changing its internal verdict value
  to `not_enough_evidence`.
- Map `sourceClass` to the existing visual `band` prop only at the presentation boundary;
  never derive source independence from channel or color.
- Replace the simulated call timer with `useCaseyVoice` state while preserving the call
  card's layout and controls.
- Pass one completed `ScoreReceipt` into `Receipt`; the component only renders it.
- Keep animations, focus behavior, sound hooks, classes, spacing, and breakpoints intact.

Opening and pinning cannot remain the same action. If the current design has no pin/unpin
control, the backend exposes `isPinned`, `canPin`, `onPin`, and `onUnpin` props and uses
the UI team's approved placement and existing visual tokens. It must never silently
count every opened card as evidence.

Likewise, the data contracts must expose consent state, visible captions/transcript,
pressure cards, and the Trust Chain. If a required visual slot is absent, coordinate its
placement rather than inventing a new layout.

## Testing strategy

### Tooling and scripts

Add Vitest for unit/integration tests and Playwright for the browser demo path. Add these
scripts when their corresponding layers exist:

```json
{
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "check": "npm run lint && npm run typecheck && npm run test && npm run build"
}
```

Do not make automated tests consume real ElevenLabs credits. Provider calls are mocked
at the `elevenlabs.server.ts` boundary; real-agent checks are a separate manual gate.

### Case validation tests

- Valid Case 01 fixture passes.
- Duplicate case, artifact, and action IDs fail.
- Missing reveal and unlock references fail.
- Invalid verdict, source class, channel, tactic, weight, or risk cost fails.
- A call duration above 75 seconds fails.
- Case 01 without decisive independent scam evidence fails.
- Unsafe or unapproved debrief URLs fail.

### Engine tests

- Initial state reveals only authored starting evidence.
- Known actions reveal only their authored artifacts.
- Unknown actions and artifacts do nothing or return a typed rejection.
- Unrevealed evidence cannot be pinned.
- Duplicate pins are ignored and pin order is stable.
- A fourth pin is rejected.
- Unpinning restores one slot.
- Unknown, duplicate, and fourth pressure cards are rejected.
- Verdict commits once and locks scored state.
- Reset produces a clean session with no pressure cards or verdict.

### Scoring and Receipt tests

- Correct verdict awards exactly 400; incorrect awards zero.
- Decisive independent support awards 300.
- Independent corroboration awards 150.
- Claimant-only proof awards zero independence.
- Supporting and contradictory weights clamp to 0–200.
- Risk costs clamp composure to 0–100.
- An ideal Case 01 path totals 1,000.
- A correct empty-evidence guess totals no more than 500.
- Time, transcript, mode, and pressure cards do not change the score.
- `not_enough_evidence` receives independence credit only after the required unresolved
  independent check.
- Receipt groups multiple channels with one `sourceRoot` into one provenance branch.
- Receipt generation is deterministic and idempotent.

### Voice server tests

Inject the provider fetcher, clock, timeout, logger, and limiter so tests remain
deterministic.

- Missing environment values return 503 without calling the provider.
- Invalid JSON, extra fields, and unknown case IDs return 400.
- Cross-origin requests return 403.
- Rate-limited requests return 429 with `Retry-After`.
- The provider request uses the server agent ID and `xi-api-key` header.
- The route never places the API key in the URL or response.
- Provider 401, 403, 422, 429, and 5xx responses become a sanitized 502.
- Timeout becomes 504.
- Malformed provider JSON becomes 502.
- Success returns the token, conversation ID, and exact Case 01 variables.
- Every response is non-cacheable.
- Captured logs contain no key, token, provider body, or transcript.

### Frontend integration tests

- Consent appears before any microphone request.
- Choosing fallback never requests microphone access.
- Permission denial enters fallback immediately.
- A successful token response starts one session with the returned token and variables.
- Hang-up and unmount each end the session once.
- The 75-second application timer starts on connection, not on button click.
- A valid tool call deals one face-down card.
- Duplicate and unknown tactics do not produce additional cards.
- Network loss preserves game progress and exposes fallback.
- Replaying requests a fresh token and clears prior pressure cards.
- Transcript text is rendered/captioned but never reaches scoring.

### End-to-end demo-path test

The required Playwright test uses fallback or a deterministic voice adapter, not the live
provider:

1. Deal Case 01.
2. Choose the no-microphone path.
3. Open one claimant-rooted route.
4. Find and use the independent directory route.
5. Pin selected evidence.
6. Commit `scam`.
7. Verify the Receipt truth, source branches, score dimensions, total, pressure
   explanation, and real-world action.

Add one mocked-voice integration path if time permits: consent, token success, connected
state, one `urgency` tool call, hang-up, investigation, and Receipt.

Because UI design is fixed, take baseline screenshots at 390 px and desktop width before
wiring, then compare after integration. Functional changes may alter content/state, but
must not unintentionally alter layout, tokens, focus visibility, or reduced-motion
behavior.

### Real ElevenLabs verification

Automated tests do not replace provider testing. In the ElevenLabs dashboard, run the
required Simulation, Next Reply, and Tool Call tests in [ELEVENLABS.md](ELEVENLABS.md),
including contradiction handling, prompt extraction, personal-data disclosure,
out-of-enum tactics, and clean end-call behavior.

Then test on localhost and the deployed HTTPS origin:

- microphone allowed and denied;
- valid protected-agent connection;
- bad/expired API key and wrong agent ID;
- token timeout and network loss;
- valid, duplicate, and invalid pressure tool calls;
- hang-up, route change, replay, and the 75-second limit; and
- fallback completion through the same Receipt.

Check provider usage after the smoke tests. Do not log or retain raw audio/transcripts in
Casey.

## Implementation order and gates

### Phase 1 — contract and Case 01

1. Add test tooling and typecheck scripts.
2. Replace duplicate case types with the canonical runtime schema.
3. Author the complete Case 01 artifact/action/source graph.
4. Add the case registry and cross-reference validator.

**Exit:** Case 01 validation tests pass and no UI imports the legacy case contract.

### Phase 2 — deterministic engine

1. Implement session types, reducer, and selectors.
2. Implement the exact four-part score.
3. Implement Receipt explanation keys and provenance grouping.
4. Add golden Case 01 score and Receipt tests.

**Exit:** the full Case 01 round can execute in tests with no React, browser, network, or
model dependency.

### Phase 3 — existing UI wiring

1. Add `useGameSession` as the only React state adapter.
2. Wire existing cards/actions to reveal and pin events.
3. Wire verdict submission to one immutable Receipt.
4. Preserve styling and verify keyboard, focus, reduced motion, and 390 px layout.

**Exit:** Case 01 completes locally through deterministic fallback and the UI no longer
duplicates score or unlock rules.

### Phase 4 — secure voice backend

1. Implement environment access and safe variable construction.
2. Implement the ElevenLabs token client with abort timeout and response validation.
3. Implement request/origin/limit/error handling.
4. Keep `app/api/voice-session/route.ts` as a thin adapter.
5. Complete route integration tests before using real credentials.

**Exit:** the mocked route matrix is green, and a manual request obtains a fresh token
without exposing the API key.

### Phase 5 — live voice and fallback integration

1. Install and wrap the current React SDK provider.
2. Implement consent and the voice lifecycle adapter.
3. Register and validate `dealPressureCard`.
4. Implement timeout, cleanup, captions/transcript, and automatic fallback.
5. Run dashboard tests and the localhost browser matrix.

**Exit:** a live call visibly deals a pressure card, and every tested failure preserves a
playable round.

### Phase 6 — release checks

Run, in order:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Then verify deployment environment variables, HTTPS microphone behavior, platform rate
limiting, provider retention settings, usage balance, fallback assets, and the complete
two-minute demo.

## Definition of done

- Backend/domain logic is contained in `lib/cases`, `lib/engine`, `lib/voice`, and
  `lib/session`.
- `app/api/voice-session/route.ts` contains only framework adaptation.
- UI components render state and dispatch events; they do not own scoring or unlock
  rules.
- Opened artifacts and pinned evidence are distinct.
- Source root and source class are explicit and independent of channel.
- Case 01 can earn exactly 1,000 through its ideal authored path.
- The API key never appears in a client bundle, response, URL, or log.
- The protected ElevenLabs session uses a fresh WebRTC token.
- The pressure tool is strictly allowlisted, deduplicated, capped, and score-neutral.
- Voice failure always reaches the same playable fallback loop.
- No raw audio or transcript is stored by Casey.
- Unit, integration, build, and the fallback demo-path E2E checks pass.
- A real deployed live call changes the board and ends cleanly.

## Deferred work

Do not add these until the complete Case 01 demo and all gates above are green:

- Case 02 presentation polish;
- Case 03 presentation polish;
- accounts, authentication, or profiles;
- a database or case CMS;
- persistent telemetry or leaderboard APIs;
- webhooks or additional agent tools;
- real phone calls or payment flows; or
- AI-generated evidence, truth, scoring, or debrief advice.

If a leaderboard is later approved, the server must recompute a submitted result by
replaying allowlisted session events against the authored case. It must never trust a
browser-submitted total score.
