# Casey — HackRice 16 Judging Audit

This is a deliberately strict review against the five criteria recorded from the team’s
HackRice 16 handbook. The [official event site](https://hackrice.com/) confirms the
September 11–13, 2026 event, casino/card theme, and Games & Gamification track. The
deterministic Case 01 and fallback demo path are now implemented and automated; live
provider behavior and human comprehension are not yet verified. No design can guarantee
a 9+ judge score; Casey earns that range only by shipping and showing the evidence gates
below.

## Executive verdict

**Go, with a narrowed thesis.** The strongest version of Casey is not a phishing quiz
with a voice API attached. It is a short investigation game about **source independence**:
the player constructs a Trust Chain while a live character tries to keep every
confirmation inside one controlled network.

The first draft had a memorable visual metaphor and a strong educational reveal. Its
largest weaknesses were weak proof of impact, a score that rewarded opening everything,
an optional-sounding voice layer, unsupported claims, and scope borrowed from sponsors
not listed in the handbook. The canonical build design corrects those product issues;
implementation evidence is still required.

## Honest baseline

| Handbook criterion | Implemented evidence | Remaining proof gap |
|---|---|---|
| Technical Rigor | Validated case graph, pure reducer, deterministic Receipt, secure token route, and automated fallback path | Real protected-agent call on the deployed HTTPS origin |
| Originality & Creativity | Source-root collapse and pressure-card mechanic are implemented | Observe whether first-time players notice the source distinction without coaching |
| User Experience & Design | Consent, fallback, pin limit, verdict confirmation, Receipt, keyboard dialog behavior, and reduced motion are present | Manual 390 px/device pass and five rapid playtests |
| Practicality & Impact | The lesson and FTC-backed real-world action are explicit | Measured comprehension and completion results with the actual sample size |
| Relevance | The card-table game loop and ElevenLabs client-tool boundary are implemented | Demonstrate reliable live voice during judging and avoid unsupported outcome claims |

## Design changes that move the ceiling

1. **Opened is not proven.** Players intentionally pin up to three artifacts. This turns
   browsing into a decision and makes the verdict defensible.
2. **Model source roots, not just channels.** An email and a phone call can still trace
   to one claimant. Independence is computed from authored provenance data.
3. **Make voice change the board.** The ElevenLabs agent calls an allowlisted client tool
   to deal face-down pressure cards. They flip after the verdict to explain urgency,
   authority, or scarcity without spoiling the call.
4. **Keep truth outside AI.** Voice can vary; case truth, unlocks, and score cannot.
5. **Use three valid verdicts.** A legitimate case and an unresolved case prevent blind
   skepticism from winning.
6. **Measure learning without pretending.** Compare independent-verification behavior
   between first and later cases; display only anonymous aggregates with sample size.
7. **Design failure as a mode.** Mic denied, API down, or Wi-Fi lost switches to a clearly
   labeled text/prerecorded call while preserving the investigation and Receipt.
8. **Keep sponsor use coherent.** ElevenLabs is central.
   [MLH's current prize page](https://www.mlh.com/events/hackrice-71/prizes) confirms
   Tiger Data; use it only to measure the core independent-verification behavior.
   Notability counts only if the team genuinely uses and documents it.

## 9+ evidence gates

### Technical Rigor — target 9.2

The demo must prove all of the following:

- Live ElevenLabs turn-taking works from the deployed app.
- A validated client tool causes a visible pressure card to be dealt.
- Per-case variables alter one agent without changing deterministic case truth.
- API credentials remain server-side behind short-lived call authorization.
- Scoring and case validation have meaningful unit tests, including malformed cases and
  source-root edge cases.
- The same case reaches the same Receipt for the same actions regardless of dialogue.
- A network/microphone failure completes through fallback rather than an error screen.
- A 20-second architecture explanation makes the AI/deterministic boundary obvious.

**Do not add a database merely to look technical.** Tiger Data earns its place only when
its hypertable and aggregate make privacy-minimized learning behavior visible without
becoming a dependency of the round.

### Originality & Creativity — target 9.3

- Lead with: “Most training asks whether a message looks suspicious. Casey asks whether
  your proof is actually independent.”
- Show the same-source reveal visually: email → supplied phone number → same claimant.
- Let the caller's tactics create pressure cards, then flip them in the Receipt.
- Demonstrate that voice responses vary while the authored evidence graph stays fair.
- Avoid marketing Casey as a generic “AI scam detector”; that category is crowded and it
  is not what this product does.

### User Experience & Design — target 9.3

- Five first-time tests; at least 4/5 can state the goal without verbal coaching.
- Median Case 01 completion under two minutes.
- A single primary action per state; no unexplained icon-only controls.
- Clear states for mic permission, connecting, listening, speaking, reconnecting,
  fallback, and ended.
- Pin/unpin is obvious, the three-pin limit is visible, and verdict confirmation prevents
  accidental submission.
- 390 px layout, keyboard-only completion, visible focus, reduced motion, captions/text
  path, and words/icons in addition to color.
- Deal animation occurs once; motion thereafter responds to player or caller action.
- The Receipt is the visual climax, not a generic score modal.

### Practicality & Impact — target 9.1

- Use one sourced problem statistic: FTC-reported job-scam losses rose from $90 million
  in 2020 to $501 million in 2024
  ([FTC](https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024)).
- State the behavior Casey trains: leave the claimant's channel and verify via a source
  the player found independently.
- Include a legitimate case so success means calibrated trust, not paranoia.
- Record playtest sample size and whether players use independent evidence in later
  cases. Never claim causation from a weekend sample.
- Show scale through authored case packs for universities, employers, and financial
  institutions—not by claiming production readiness.
- End the Receipt with one action players can perform in the real world.

### Relevance — target 9.5

- Enter **Games & Gamification only**, matching the handbook's one-track rule.
- The loop must contain challenge, agency, feedback, scoring, mastery, and replay—not
  merely educational content with points.
- Submit to the ElevenLabs challenge because live adaptive voice and client tools are
  essential to the experience.
- Use casino/card language and visual design as a coherent interaction metaphor. Confirm
  the official event theme before claiming theme-prize eligibility; the handbook only
  guarantees a surprise for theme-related submissions.
- A second case is more valuable to track relevance than a leaderboard because it proves
  mastery and counters the “always pick scam” strategy.

## Judge-facing proof matrix

| What the judge sees | Criteria supported |
|---|---|
| Live caller adapts and deals a pressure card | Technical Rigor, Originality, ElevenLabs relevance |
| Player chooses between supplied and independent routes | Originality, Games relevance, Impact |
| Trust Chain maps multiple channels to one source root | Originality, UX, Impact |
| Deterministic Receipt and score breakdown | Technical Rigor, UX |
| Legitimate second case or its authored/tested fixture | Relevance, Impact, replay value |
| Mic/network fallback completes the same loop | Technical Rigor, UX, Practicality |
| Five-person comprehension results with sample size | UX, Impact |

## Feature priority by score gain

| Priority | Feature | Expected score gain | Effort/risk |
|---:|---|---|---|
| 1 | Pin evidence + source-root Trust Chain | Very high across four criteria | Medium / low |
| 2 | Deterministic Receipt | Very high across four criteria | Medium / low |
| 3 | Live caller + pressure-card client tool | Very high for rigor/originality | High / high |
| 4 | Complete fallback mode | High for rigor/UX | Medium / low |
| 5 | Legitimate Case 02 | High for game depth/impact | Medium / low |
| 6 | Five-person test and iteration | High for UX/impact credibility | Low / low |
| 7 | Tiger Data anonymous outcome aggregate | Medium-high for impact/rigor and sponsor evidence | Medium / medium |
| 8 | Leaderboard | Low-to-medium for replay | Medium / medium |
| 9 | Any unrelated sponsor API | Negative until core is finished | High / high |

## Red-team objections

| Likely objection | Strong answer requires |
|---|---|
| “Isn't this just security training?” | Let the judge construct a proof under pressure; show the source graph, not a lesson slide. |
| “Why does this need AI?” | Replay the same case with a different conversational path and identical deterministic truth; show pressure-card integration. |
| “Why is it a game?” | Point to constrained choices, evidence construction, score tradeoffs, feedback, multiple truth states, and replay. |
| “Could it teach scammers?” | Show fictional bounded beats, no real targets/data, no operational fraud instructions, and deterministic educational content. |
| “Does it work without Wi-Fi?” | Trigger fallback and finish the same Receipt in front of them. |
| “Did it improve behavior?” | Give measured playtest behavior with sample size and say plainly that a hackathon test demonstrates comprehension, not long-term efficacy. |

## Submission guardrails

- The handbook requires a 3–4 minute video and allows at most one track.
- Live judging is 2 minutes of demo plus 1 minute of Q&A, repeated 3–4 times.
- Do not repeat the old fictional line “127 people played; 61% got fooled” unless those
  values are actually measured and the sample definition is stated.
- Tiger Data's prize is confirmed by MLH, but do not claim Casey uses it until a real
  service, deployed write, aggregate query, and privacy-safe result are verified.
- Take screenshots and record the resilient demo before feature freeze.
