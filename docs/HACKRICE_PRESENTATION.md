# Casey — HackRice 16 Presentation Playbook

This is the private preparation document for Casey's Devpost video, live judging demo,
and judge Q&A. Do not paste this entire file into Devpost.

## 1. Official format and submission decisions

The public HackRice 16 Devpost page is the authoritative public source for submission
requirements. It permits at most one track, allows multiple sponsor challenges, requires
a 3–4 minute video, and recommends a 30-second introduction, 2-minute demo, 30-second
technical explanation, and 30-second impact section.^1 The same page lists five judging
criteria: Relevance, Originality/Creativity, Practicality/Impact, User Experience/Design,
and Technical Rigor.^1

The official event site defines Games & Gamification as using interactive mechanics or
game-design theory to make everyday challenges engaging. It lists hacking ending at
9:00 AM CT, judging beginning at 9:30 AM, and the top-five presentation at 2:00 PM on
Sunday, September 13, 2026.^2 Devpost also records the submission deadline as 9:00 AM
CDT.^1

No public HackRice 16 handbook PDF was discoverable through the official site, Devpost
Resources, Devpost Rules, or web search. The **2-minute live demo plus 1-minute Q&A**
format comes from the team's attendee-handbook notes in [PROJECT.md](PROJECT.md) and
[JUDGING.md](JUDGING.md). Confirm that timing once more in the attendee handbook or
HackRice Discord before judging.

### Locked submission choices

| Item | Casey decision |
|---|---|
| Track | Games & Gamification — select no second track |
| Challenges | Best Project Built with ElevenLabs; MLH Best Use of ElevenLabs; MLH Best Use of Gemini API; MLH Best Use of Tiger Data |
| Video target | 3:30, leaving 30 seconds of safety inside the 3–4 minute requirement |
| Live target | Finish the core reveal by 1:50, leaving 10 seconds of recovery time |
| Primary story | Independent-source investigation, not an AI scam detector |
| Primary integration | ElevenLabs adaptive caller and pressure-card client tool |
| Secondary integrations | Gemini's bounded post-Receipt challenge and Tiger Data's server-rescored shared board |

The official rules say hackathon work must be completed during the event and external
libraries/frameworks must be credited.^3 Keep the Devpost technology list and repository
README accurate.

## 2. The story judges should remember

### One-sentence pitch

> Casey turns “verify independently” from advice into a tense, two-minute skill players
> can practice.

### Opening hook

> A convincing email gives you a phone number. You call, hear the same details, and feel
> reassured. But if the email and number share one owner, you have heard one story twice.

### Original mechanic

> Most scam training asks whether a message looks suspicious. Casey asks whether the
> player's proof is actually independent.

### Technical thesis

> The conversation is generative. The evidence is authored. Every verdict and score is
> reproducible.

### Closing line

> Before you trust a claim, find a source the claimant does not control.

Do not replace this story with a list of API names. Every technology must explain a
visible player experience or a reliability boundary.

## 3. Judging-criteria proof map

| Criterion | What to show | What to say |
|---|---|---|
| Relevance | Investigation choices, three evidence slots, confidence stake, Receipt, casino table | “The player makes constrained choices, commits a wager, receives explainable feedback, and can replay across different truth states.” |
| Originality/Creativity | Email and supplied call collapsing into one claimant source | “A new channel is not necessarily a new source.” |
| Practicality/Impact | Independently found directory route and real-world action on the Receipt | “Casey practices one transferable behavior: leave the claimant's channel.” |
| User Experience/Design | Mic consent, live captions, obvious pin count, clear verdicts, polished Receipt | “The same round remains playable through an authored fallback.” |
| Technical Rigor | Live voice changing the board, deterministic source graph, server-only tokens, Gemini validation, server-rescored board | “Models add adaptation, while typed code controls truth, evidence, and score.” |

FTC data gives one defensible impact statistic: reported losses for job and employment-
agency scams increased from $90 million in 2020 to $501 million in 2024.^4 Use that one
statistic; do not bury the pitch in numbers.

## 4. Claim audit: what is safe to say today

The following table reflects the repository and checks run on September 13, 2026.

| Claim | Current evidence | Safe wording |
|---|---|---|
| Core game | Three cases are enabled and the deterministic engine, pinning, scoring, Receipt, fallback, stakes, and replay are implemented | “Casey has three playable authored cases.” |
| Case truths | Case 01 is scam; Case 02 is bank impersonation/scam; Case 03 is legitimate | “Always choosing Scam loses.” |
| Three verdict buttons | Scam, Legitimate, and Not enough evidence are selectable | “Players can choose among three verdicts.” |
| Unresolved truth state | No enabled case currently has `not_enough_evidence` as its truth | **Do not say** all three outcomes are represented. Say the unresolved case is next. |
| Automated quality | Lint, typecheck, 134 unit/route tests, production build, and 14 desktop/mobile browser tests passed | “The deterministic and fallback paths are covered by automated tests.” |
| ElevenLabs | A local protected WebRTC session and server token minting were verified | “Live voice works locally.” Do not call deployed voice verified until a production smoke test passes. |
| Pressure-card tool | Client handler and validation are implemented and tested; a real live-agent callback has not been recorded as passing | “The agent is configured to deal a validated pressure card.” Only say it worked live if the card appears in that run. |
| Gemini | A real local structured-output request and the bounded fallback path were verified | “Gemini works locally and cannot alter evidence or score.” Do not call the deployed request verified yet. |
| Tiger Data | The configured Tiger schema is reachable; a local API smoke test previously inserted, updated, read, and removed one board row | “Tiger Data backs the server-rescored shared board in the verified local integration.” Do not call the deployed board or outcome analytics verified yet. |
| Human impact | No five-person result is recorded | **Do not invent** completion, learning, or player-count metrics. |
| Privacy | Casey's database does not store raw audio or transcripts | Say exactly this. Confirm ElevenLabs' provider-retention setting before making a broader deletion claim. |

### High-risk phrases to avoid

- “Casey detects whether a real message is a scam.”
- “The AI decides the verdict.”
- “Gemini reads every document.”
- “All three verdicts are correct in one of our current cases.”
- “Tiger analytics prove that players learned.”
- “Nothing is retained anywhere,” unless the provider-retention configuration is verified.
- “The deployed integrations are fully verified,” until the production smoke tests pass.
- “We will get 100/100” or any guaranteed judging result.

## 5. Presenter roles

Use two clearly separated jobs.

### Presenter A — story and narration

- Delivers the hook, technical boundary, impact, and closing line.
- Watches the judges rather than the laptop.
- Stops speaking while the ElevenLabs caller is speaking.
- Owns Q&A unless Presenter B is directly asked an implementation question.

### Presenter B — operator and technical backup

- Controls the browser and keeps a silent timer visible only to the team.
- Uses the exact rehearsed click path.
- Switches to fallback without apology if the live provider stalls.
- Answers implementation, database, test, and security questions.

Replace `[NAME 1]`, `[NAME 2]`, and `[TEAMMATE RESPONSIBILITIES]` before recording.

## 6. Pre-recording and pre-judging setup

### Verify the build

Run these before the final recording and again before judging:

```bash
npm run check
npm run test:e2e
npm run db:verify
```

`npm run db:verify` requires the configured Tiger connection. Never display `.env.local`,
provider keys, database URLs, or raw request headers on screen.

### Prepare a clean ranked round

1. Use a dedicated browser profile for judging.
2. Open `/?demo=1` once to clear Casey progress and open Case 01.
3. Navigate back to `/`.
4. Enter the presentation name and save the generated leaderboard nickname.
5. Select **The Meridian Offer**.
6. Stop on the incoming-call screen before pressing **Answer**.
7. Confirm Case 01 is not labeled **Practice replay**.

The extra return to `/` matters because the demo reset also clears the board nickname.
Completing the nameplate off-stage prevents a nickname prompt from interrupting the
Receipt.

### Prepare three levels of backup

1. **Primary:** deployed HTTPS app with live ElevenLabs, Gemini, and Tiger credentials.
2. **Secondary:** a separate browser profile already on Case 01 with microphone blocked,
   ready to demonstrate the automatic authored fallback.
3. **Final:** a local production build plus a downloaded copy of the final demo video.

Also:

- connect power and disable sleep;
- enable Do Not Disturb and close notifications, email, Discord pop-outs, and password managers;
- test the room's audio output and microphone;
- close provider dashboards and developer consoles;
- keep only the demo tab and one backup tab visible;
- confirm browser zoom keeps the call, investigation actions, and evidence readable;
- check ElevenLabs usage and preserve the judging reserve;
- verify the video link works in a signed-out/incognito browser;
- keep a local MP4 copy and three clean screenshots: incoming call, evidence table, Receipt.

## 7. Devpost video script — target 3:30

The script follows HackRice's official 30/120/30/30 outline.^1 Record at 1920×1080 if
possible. Capture system audio and presenter audio separately, add captions, and keep the
mouse movement deliberate. Trim dead connection time, but never fake a provider response
or label fallback output as live.

### 0:00–0:30 — Introduction

**Visual:** Casey title, both team members briefly on camera, then the landing/table
screen. Display a small text line: `Games & Gamification · ElevenLabs · Gemini · Tiger Data`.

**Presenter A:**

> Hi, we're [NAME 1] and [NAME 2], a two-person team from ULM. A convincing email gives
> you a phone number. You call it, hear the same details, and feel reassured. But if one
> claimant controls both, you have heard one story twice. Casey is our Games &
> Gamification project, built with Next.js, TypeScript, ElevenLabs, Gemini, and Tiger
> Data. It turns independent verification into a two-minute skill players can practice.

### 0:30–2:30 — Product demo

#### 0:30–0:48 — Take the call

**Visual/operator:** Begin on **The Meridian Offer** incoming-call screen. Briefly show
the mic disclosure, press **Answer**, and wait for the live status.

**Presenter A:**

> Morgan claims this fictional research job pays four hundred fifty dollars a week and
> needs an answer today. Casey explains that ElevenLabs processes microphone audio before
> asking for permission.

**Presenter B, to the caller:**

> Why do I have to decide today?

Stop narrating while the caller answers. If an actual pressure card appears, leave it
visible. If it does not appear, continue without claiming a successful live tool call.

#### 0:48–1:20 — Show the false confirmation

**Visual/operator:** End the call after one useful response. Open **Offer email**, choose
**Pin as evidence**, and close it. Select **Call the supplied number**, open **Supplied
number**, pin it, and close it.

**Presenter A:**

> The caller can adapt, but speech never becomes evidence automatically. I pin the offer
> email, then call the number inside that email. The details match, yet Casey still traces
> both cards to the Meridian claimant. A different channel has not created an independent
> source.

#### 1:20–1:48 — Build independent proof

**Visual/operator:** Select **Find Harlow's directory**, then **Call the directory-listed
office**. Open **Directory-listed call**, pin it, and close it.

**Presenter A:**

> Now I leave the claimant's channel. I find Harlow's directory independently and call
> the listed office. It confirms that the university has no Meridian group or matching
> position. This is decisive because the claimant did not provide the route.

#### 1:48–2:10 — Commit and reveal

**Visual/operator:** Choose **Call it a scam**, keep the 25-chip stake, press **Submit
verdict**, then **Lock verdict**. Scroll just enough to show the source branches and score.

**Presenter A:**

> I stake my confidence and commit Scam. The Receipt is deterministic: it reveals the
> authored truth, scores verdict, independence, evidence quality, and composure, and
> collapses the email and supplied call into one claimant-controlled branch.

#### 2:10–2:30 — Gemini cross-examination

**Visual/operator:** Scroll to **Moriarty's Objection**, press **Invite Moriarty**, then
choose **Directory-listed call**. Show **GEMINI LIVE** and **CHAIN HELD** only if the live
request actually produced them. Otherwise leave the visible **CASEY FALLBACK** label and
explain the fallback honestly.

**Presenter A:**

> Gemini now plays Moriarty and attacks one assumption in my Trust Chain. It receives
> only bounded fictional source metadata and phrases the objection. Casey's deterministic
> engine checks my defense, so Gemini can challenge the reasoning without changing the
> evidence, verdict, or score.

### 2:30–3:00 — Technical design and implementation

**Visual:** Show the architecture diagram from the README, then briefly show the board.
Do not open source files long enough to make judges read code.

**Presenter B:**

> Under the hood, a validated case graph defines every artifact, action, source root, and
> scoring rule. A protected server route mints a short-lived ElevenLabs WebRTC token, so
> the API key never reaches the browser.^5 The agent's pressure-card tool is allowlisted
> and validated before it can change the UI.^6 Gemini returns schema-constrained copy,
> which Casey validates again.^7 Tiger Data stores the shared board, but our server
> reconstructs and rescores each submission instead of trusting a browser-supplied total.

Only show the shared board if it is connected to the real Tiger service. If it says the
shared board is unavailable, omit this shot and use the architecture diagram.

### 3:00–3:30 — Impact and future

**Visual:** Show the three-case catalog, including the bank and campus-shift cases, then
end on the Receipt or Casey wordmark.

**Presenter A:**

> The FTC reports that job-scam losses rose from ninety million dollars in 2020 to five
> hundred one million in 2024.^4 Casey currently includes three authored cases, including
> bank impersonation and a legitimate caller who sounds awkward, so always choosing Scam
> does not win. Next we will run first-time-player tests and add a case where uncertainty
> is the correct outcome. Casey's takeaway is simple: before you trust a claim, find a
> source the claimant does not control.

### Video editing checklist

- Final runtime is between 3:00 and 4:00; target 3:25–3:40.
- Both team members and the track/challenges appear in the first 30 seconds.
- At least one caller response is audible and captioned.
- The demo shows a claimant route, an independent route, three pins, verdict, and Receipt.
- The source-collapse reveal remains on screen long enough to understand.
- Gemini is labeled live or fallback exactly as the UI reports.
- Tiger is shown only with a real configured service response.
- No credentials, personal messages, bookmarks, or browser notifications appear.
- The description includes the deployed link, repository link, and technology credits.
- The uploaded video is playable without requesting access.

## 8. Live judging script — 2:00 maximum

This version prioritizes the core idea over showing every integration. Presenter B
operates; Presenter A speaks. Rehearse until the Receipt appears by 1:40.

| Time | Operator | Presenter A |
|---|---|---|
| 0:00–0:10 | Start on Case 01 incoming call | “Most scam training asks whether a message looks suspicious. Casey asks whether your proof is actually independent.” |
| 0:10–0:35 | Press **Answer**. Ask, “Why do I have to decide today?” Let one response play. End the call. | “ElevenLabs makes the fictional caller adaptive. When it uses pressure, it can deal a validated face-down tactic card onto the table.” |
| 0:35–0:55 | Pin **Offer email**. Reveal and pin **Supplied number**. | “The number confirms the story, but the email supplied that number. These are two channels controlled by one claimant.” |
| 0:55–1:18 | **Find Harlow's directory** → **Call the directory-listed office** → pin **Directory-listed call**. | “This route was found independently. Harlow says there is no Meridian group, giving us decisive proof outside the claimant's control.” |
| 1:18–1:38 | **Call it a scam** → **Submit verdict** → **Lock verdict**. | “Now I commit the verdict. Dialogue can vary, but the same actions always produce the same score.” |
| 1:38–1:52 | Show the score and scroll to both source branches. | “The Receipt collapses the email and supplied phone call into one source, then separates the directory evidence. That is Casey's central reveal.” |
| 1:52–2:00 | Stop clicking. Face judges. | “Gemini can cross-examine this chain, and Tiger stores the server-rescored board. The habit Casey trains is simple: build proof the claimant does not control.” |

### What to cut when behind

1. At 0:35, end the caller even if the conversation could continue.
2. Do not open the linked staff page.
3. Do not demonstrate stakes beyond leaving the default 25 selected.
4. Do not invoke Moriarty live in the 2-minute version.
5. Never cut the independent directory route or Receipt reveal.

## 9. What to show and what not to show

| Show | Do not show |
|---|---|
| One complete Case 01 path | All three cases played end to end |
| One short live caller exchange | A long open-ended conversation |
| A pressure card if it genuinely appears | Waiting repeatedly for the tool or pretending it fired |
| Email plus supplied call sharing one source | Every artifact and every UI feature |
| Independent directory route | **Send the ID form** during judging |
| Three deliberate pins | Opening everything without explaining the pin rule |
| Receipt source branches and score | Leaderboard before the Receipt |
| Brief architecture boundary | Provider dashboards, terminal logs, environment files, or raw JSON |
| Gemini after the Receipt in the video | Calling Gemini a document judge or source of truth |
| Tiger's real shared board in the video | Empty tables, development errors, or unverified analytics |
| Legitimate case visible in the catalog | Claiming a current unresolved case exists |
| Explicit mic consent and captions | Real personal data or a real person's cloned voice |

## 10. Failure and recovery script

External failure is part of Casey's design. Recover calmly and use it as technical proof.

### ElevenLabs does not connect

If the call is not listening within five seconds, move to the prepared fallback browser
profile. Say:

> The live provider is unavailable, so Casey has switched to its authored call. The same
> evidence graph, choices, score, and Receipt remain available.

Do not spend the demo debugging Wi-Fi, permissions, or API keys.

### Microphone permission is denied

Let the automatic fallback appear. Say:

> Microphone access is optional. Denial creates a labeled text call rather than a dead
> end.

### The pressure card does not appear

Continue the investigation. Do not say the live tool succeeded. During Q&A, say the
client handler and validation are implemented, while that particular live run did not
produce the callback.

### Gemini displays `CASEY FALLBACK`

Continue and say:

> Gemini is unavailable, so Casey is using authored wording. Notice that the challenge
> still works because the model never owned correctness.

### Tiger board is unavailable

Do not open it during the core demo. If asked, show the local-fallback label and say:

> The board is failure-isolated. Tiger stores shared results when configured, while the
> game and local progress continue without the database.

### Deployed site fails

Open the prepared local production build. If that also fails, play the downloaded demo
video and use the remaining time for architecture and Q&A. Never debug live in front of
judges.

## 11. One-minute Q&A priorities

In one minute, judges will normally ask only two or three questions. Memorize the first
six answers; use the extended bank for follow-ups.

### 1. What is Casey?

> Casey is a voice-first investigation game that teaches players to verify a claim
> through a source the claimant does not control. Players build a three-card Trust Chain
> and receive a deterministic Receipt explaining whether their confidence was justified.

### 2. What is original about it?

> Casey scores provenance rather than superficial warning signs. An email, website, and
> phone call can look like three confirmations, but Casey reveals when all three trace to
> one claimant-controlled source.

### 3. Why does this need AI?

> Social pressure is interactive, so ElevenLabs lets the caller respond naturally to the
> player's questions. Gemini then challenges the player's reasoning, while deterministic
> code keeps both models outside evidence, truth, and scoring.

### 4. What was technically difficult?

> We combined low-latency protected voice, validated client-tool state changes, an
> explicit source-provenance graph, deterministic scoring, bounded Gemini output, and a
> server-rescored shared board—while preserving a complete fallback path.

### 5. How do you prevent hallucinations from breaking the game?

> Models never create evidence or determine correctness. ElevenLabs receives an
> allowlisted fictional case configuration, Gemini returns four short schema-constrained
> strings, and Casey validates external output before displaying it.

### 6. What happens without Wi-Fi or a provider?

> Casey switches to authored fallback dialogue and preserves the same investigation,
> verdict, and Receipt. Gemini and Tiger also fail independently, so neither can block the
> core round.

## 12. Extended judge Q&A bank

### Why is this a game instead of a training website?

> Players choose investigation routes, manage only three evidence slots, stake chips,
> commit one ranked verdict, receive explainable feedback, and replay cases with different
> truths. Those decisions make the lesson something the player performs rather than reads.

### How exactly does ElevenLabs change the experience?

> The caller adapts to what the player asks and can invoke `dealPressureCard`, which
> changes visible board state. Those face-down cards later reveal urgency, authority,
> scarcity, or reciprocity tactics.

### Do you use a separate ElevenLabs agent for every case?

> No. Casey uses one protected agent with server-selected, allowlisted dynamic variables
> for each fictional case. Truth and scoring remain in the case engine, so adding a case
> does not require giving the model more authority.

### How long can a call run?

> We target 45–60 seconds for the experience and enforce a 75-second application limit.
> The call also ends when the player hangs up, changes routes, submits a verdict, or
> leaves the page.

### What does Gemini actually read?

> Gemini does not receive arbitrary uploaded documents or the voice transcript. The
> server sends only fictional artifact titles, source labels, source classes, and a
> deterministic challenge type so Gemini can phrase a bounded objection.

### Why Gemini if Casey already knows the answer?

> Casey knows correctness, but Gemini makes the cross-examination varied and responsive.
> It acts like an opposing character, while the deterministic engine remains the referee.

### What if Gemini returns invalid content?

> The route validates the JSON schema, field lengths, markup, and requested artifacts.
> Invalid, timed-out, or unavailable responses are replaced by authored fallback copy.

### How do you use Tiger Data?

> Tiger Data stores the shared leaderboard. The server accepts case choices rather than a
> claimed score, rebuilds the canonical result, rescoring it before the database write.
> We also prepared a privacy-minimized outcome hypertable and continuous aggregate, but
> live outcome ingestion is not yet a deployed claim.

### Why not use only localStorage?

> LocalStorage keeps every round resilient, but it cannot create a shared tournament
> table. Tiger provides the shared PostgreSQL layer while remaining outside the critical
> game path.

### Can someone edit the browser score and cheat?

> A client-supplied total is ignored. The board route validates the case, verdict, and
> pinned artifact IDs, then computes the score again from canonical server code and uses
> an idempotent submission ID.

### What happens if Tiger Data is down?

> The board clearly switches to local results, and the game, Receipt, chips, and practice
> flow continue. Database availability never decides whether a case can be completed.

### Does Casey store voice recordings or transcripts?

> Casey's own database stores neither raw audio nor transcripts. ElevenLabs processes
> microphone audio for the live conversation; before presenting a broader retention
> claim, we verify and disclose the provider-side retention setting exactly.

### What information reaches each provider?

> ElevenLabs receives microphone audio and allowlisted fictional case variables. Gemini
> receives fictional source metadata only. Tiger receives the public board nickname and
> server-derived score summary, never audio or transcripts.

### Could the caller ask for real banking information?

> The scenario is fictional and the caller is explicitly prohibited from requesting
> money, passwords, security codes, government IDs, or banking data. The UI also warns
> players not to share personal information, and unsupported tool calls are rejected.

### Does Casey identify real scams?

> No. Casey is a practice environment, not a production scam detector or substitute for
> a bank, employer, or law-enforcement investigation. It teaches a verification habit
> players can apply through known official channels.

### Why not let players browse the open web?

> Open browsing would make a short fictional case unreliable and could expose players to
> unsafe content. Authored evidence keeps every path fair, reproducible, testable, and
> safe while still teaching source independence.

### How does scoring work?

> The 1,000-point Receipt assigns 400 points to the correct verdict, 300 to independent
> verification, 200 to evidence quality, and 100 to composure. Time never affects the
> score.

### Why can players pin only three artifacts?

> Opening a document is not the same as trusting it. The three-pin limit forces players
> to choose the evidence they are willing to defend instead of collecting every card.

### Why do you not score speed?

> Scam pressure already rewards rushed decisions in the real world. Casey deliberately
> rewards pausing and verifying, so a timer would teach the wrong behavior.

### Does “always choose Scam” win?

> No. The third enabled case is a legitimate campus-employment call that sounds awkward
> but is independently verified. Casey trains calibrated trust, not paranoia.

### Is Not enough evidence correct in a current case?

> It is a supported verdict, but no enabled case currently uses it as the authored truth.
> An unresolved case is the next content addition; we do not claim it is already shipped.

### How do you know Casey improves behavior?

> We do not claim long-term behavior change from a hackathon prototype. Our next honest
> measure is a small first-time-player test of whether people choose an independent route
> and can explain why a new channel may still share one source.

### How could Casey scale?

> The scalable unit is a validated case pack: authored artifacts, source roots, actions,
> truth, and bounded caller variables. Universities, career centers, and financial
> institutions could add scenarios without allowing a model to invent evidence.

### Why is the bank case safe?

> It uses fictional institutions, numbers, and people, and the caller cannot request
> accounts, codes, money transfers, gift cards, or remote-access software. The lesson is
> to end the supplied interaction and contact the institution through a known channel.

### What accessibility work did you include?

> Casey provides live captions or authored transcripts, a no-mic fallback, keyboard
> navigation, visible focus, reduced-motion support, non-color labels, and a tested
> 390-pixel layout.

### What did you build during the hackathon?

> We built the authored case graph, deterministic engine and Receipt, voice authorization
> and fallback, Gemini challenge boundary, Tiger-backed board, responsive interface, and
> automated tests during the event. We credited the frameworks and services we used.

### What did each teammate build?

Replace this before judging:

> [NAME 1] owned [RESPONSIBILITIES]. [NAME 2] owned [RESPONSIBILITIES]. We jointly
> designed the Trust Chain mechanic, tested the full path, and prepared the demo.

### Is it production-ready?

> It is a tested hackathon prototype, not a production security decision system. The next
> gates are deployed provider validation, provider-retention verification, first-time
> player testing, and broader case review.

### What would you build next?

> First, we would add an unresolved case where restraint is correct and run first-time
> comprehension tests. Then we would activate privacy-minimized aggregate outcome
> analytics and expand authored case packs for career centers and financial institutions.

## 13. Sponsor-specific 15-second answers

### ElevenLabs

> ElevenLabs is not decorative narration. Its adaptive caller creates the social pressure
> and can deal a validated pressure card that becomes part of the later debrief, while a
> protected server token keeps credentials out of the browser.

### Gemini

> Gemini plays Moriarty after the deterministic Receipt. It phrases a source-independence
> objection from bounded fictional metadata, while Casey selects the challenge and judges
> the defense.

### Tiger Data

> Tiger Data powers the shared tournament board. The server ignores claimed totals,
> reconstructs canonical case results, and writes only the verified score summary; local
> progress keeps the game playable if the database is unavailable.

## 14. Final submission checklist

### Devpost

- [ ] Select exactly one track: Games & Gamification.
- [ ] Select only the sponsor challenges Casey actually implements.
- [ ] Add both team members and confirm both checked into Devpost.
- [ ] Use [DEVPOST.md](DEVPOST.md) for the written description.
- [ ] Replace every placeholder in this playbook and the video.
- [ ] Credit Next.js, React, TypeScript, Tailwind CSS, Framer Motion, ElevenLabs, Gemini, Tiger Data, Vitest, and Playwright.
- [ ] Upload a public/unlisted 3–4 minute video and test it while signed out.
- [ ] Add the repository and deployed app URLs.
- [ ] Submit before 9:00 AM CDT on Sunday, September 13, 2026.^1

### Provider gates

- [ ] Deployed `/api/voice-session` returns a token and a real call reaches listening/speaking.
- [ ] A live deployed call deals at least one validated pressure card.
- [ ] ElevenLabs retention and judging usage reserve are recorded.
- [ ] Deployed Gemini shows `GEMINI LIVE`; removing/invalidating the key shows `CASEY FALLBACK`.
- [ ] Deployed Tiger board accepts one real test result, reads it back once, and does not duplicate it.
- [ ] Smoke-test rows are removed if they should not appear to judges.

### Demo readiness

- [ ] Case 01 begins as a fresh ranked round, not practice.
- [ ] Presentation name and board nickname are already saved.
- [ ] Primary, fallback-profile, local-build, and MP4 paths are ready.
- [ ] The core live run reaches the Receipt in 1:50 or less three times consecutively.
- [ ] Both presenters can deliver the first six Q&A answers without notes.
- [ ] No unmeasured player, learning, or impact result appears anywhere.
- [ ] The visible microphone-retention language matches the verified provider setting.

## Sources

1. HackRice 16. [Official Devpost overview, requirements, prizes, and judging criteria](https://hackrice-16.devpost.com/). Accessed September 13, 2026.
2. HackRice. [HackRice 16 official event site and schedule](https://hackrice.com/). Accessed September 13, 2026.
3. HackRice 16. [Official Devpost competition rules](https://hackrice-16.devpost.com/rules). Accessed September 13, 2026.
4. Federal Trade Commission. [New FTC Data Show a Big Jump in Reported Losses to Fraud to $12.5 Billion in 2024](https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024). March 10, 2025.
5. ElevenLabs. [Get WebRTC conversation token](https://elevenlabs.io/docs/eleven-agents/api-reference/conversations/get-webrtc-token). Accessed September 13, 2026.
6. ElevenLabs. [Client tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools). Accessed September 13, 2026.
7. Google AI for Developers. [Gemini API structured outputs](https://ai.google.dev/gemini-api/docs/structured-output). Accessed September 13, 2026.
8. Tiger Data. [Monitor Tiger Cloud services](https://docs.tigerdata.com/use-timescale/latest/metrics-logging/service-logs/). Accessed September 13, 2026.

