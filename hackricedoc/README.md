# Casey

**Take the call. Build the proof.**

Casey is a voice-first social-engineering investigation game for HackRice 16. A
convincing caller wants the player to trust an offer. The player can inspect messages,
make calls, consult official-looking directories, and pin up to three artifacts into a
**Trust Chain** before choosing one of three verdicts: **Scam**, **Legitimate**, or
**Not enough evidence**.

The twist is provenance. Calling the number inside a suspicious email feels like a
second confirmation, but both claims still come through the same source. Casey makes
that hidden dependency visible in a post-round **Receipt**.

## Why this is a game

- An adaptive voice character applies bounded, fictional social pressure.
- Investigation choices reveal different evidence and build different source paths.
- Players construct their own proof instead of answering a quiz.
- Face-down pressure cards from the call flip after the verdict.
- Accuracy, independent verification, evidence quality, and composure form the score.
- Multiple truth states prevent “always choose scam” from becoming a winning strategy.

## HackRice target

- **Track:** Games & Gamification — one track, as required by the handbook
- **Challenge:** Best Project Built with ElevenLabs
- **Experience target:** onboarding in 15 seconds; one complete round in two minutes
- **Build target:** one excellent live-voice case plus a resilient text/prerecorded path;
  a second case only after the core is green

Casey is currently in the **design-lock phase**. Product code and external-service setup
begin only when the build phase is explicitly started.

## Source of truth

- [Project contract](PROJECT.md)
- [Judging audit and 9+ evidence gates](JUDGING-AUDIT.md)
- [Game and technical design](casey-build-doc-final.md)
- [ElevenLabs Creator setup runbook](ELEVENLABS-SETUP.md)

The FTC reported that losses to job and employment-agency scams rose from $90 million
in 2020 to $501 million in 2024. Casey's first case focuses on a fictional student job
offer and teaches one transferable action: leave the contact channel that made the
claim and verify through a source you found independently.

Source: [FTC 2024 fraud data release](https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024).

## Repository note

This repository began as an ECC-H development harness. The existing `skills/`,
`agents/`, `commands/`, `rules/`, `hooks/`, and related scripts are development
tooling, not Casey product features. The application layout and runtime package will be
reconciled when the coding phase starts; no current harness check should be presented as
proof that the Casey game works.
