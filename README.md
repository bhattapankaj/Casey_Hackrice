# Casey

**Take the call. Build the proof.**

![Casey wordmark and playing-card mark](public/casey-banner.png)

Casey is a voice-first social-engineering investigation game for HackRice 16. A
persuasive caller wants the player to trust an offer. The player investigates the claim,
pins up to three artifacts into a **Trust Chain**, and commits to **Scam**,
**Legitimate**, or **Not enough evidence**.

The central mechanic is provenance. Calling a number supplied by a suspicious email may
feel like a second confirmation, but both claims still share one source. Casey makes that
hidden dependency visible in a post-round **Receipt** and rewards verification through a
source the claimant does not control.

## Why this is a game

- An adaptive fictional caller applies bounded social pressure.
- Investigation choices reveal different evidence and source paths.
- Three evidence slots force players to select proof instead of opening everything.
- Caller actions deal face-down pressure cards that flip during the Receipt.
- Deterministic scoring rewards accuracy, independent proof, evidence quality, and
  composure—never speed.
- Scam, legitimate, and unresolved cases prevent “always choose scam” from winning.

## Current status

Case 01 is playable end to end. It uses a runtime-validated authored case graph, a pure
reducer, a three-artifact Trust Chain, deterministic 1,000-point scoring, a provenance
Receipt, and an authored no-microphone fallback. The protected ElevenLabs WebRTC token
route and React client-tool adapter are implemented and covered with mocked tests.

Still required before calling the live voice release complete: configure and test the
protected agent in the ElevenLabs dashboard, verify a real call on the deployed HTTPS
origin, and run the five-person playtest. Tiger Data readiness is scaffolded for optional
anonymous outcome analytics, but it is not connected and no database is required for the
demo path.

## Run locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Current checks are:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Documentation

- [Product contract](docs/PROJECT.md) — canonical scope and product behavior
- [Build design](docs/BUILD.md) — game loop, cases, scoring, UX, architecture, and demo
- [Judging strategy](docs/JUDGING.md) — evidence gates and submission guardrails
- [ElevenLabs runbook](docs/ELEVENLABS.md) — agent, authentication, privacy, fallback,
  and integration contract
- [Tiger Data runbook](docs/TIGER_DATA.md) — MCP, schema, privacy boundary, and rollout
- [Repository guidance](AGENTS.md) — implementation invariants and working rules

## HackRice target

- **Track:** Games & Gamification
- **Primary challenge:** Best Use of ElevenLabs
- **Secondary challenge:** Best Use of Tiger Data after the live analytics path is proven
- **Experience:** onboarding in 15 seconds; one complete round in two minutes
- **Teaching goal:** leave the claimant’s path and verify through an independently found
  source

The [official HackRice 16 site](https://hackrice.com/) confirms the September 11–13,
2026 event and casino/card theme. The FTC reported that losses to job and
employment-agency scams rose from $90 million in 2020 to $501 million in 2024
([FTC source](https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024))..
