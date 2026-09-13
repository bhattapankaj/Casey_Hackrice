# Gemini API setup and test runbook

Casey uses Gemini for one bounded purpose: Professor Moriarty phrases a post-Receipt
objection to the player's Trust Chain. Gemini never creates evidence, decides truth,
calculates score, supplies the answer key, or determines badge eligibility.

## Configuration

1. Create or select a Google AI Studio project and API key.
2. Add these server-only variables locally and in the deployment environment:

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
```

`GEMINI_MODEL` is optional. Never prefix either variable with `NEXT_PUBLIC_` and never
place the key in browser code, screenshots, logs, or the Devpost submission.

## Request boundary

The browser posts only `caseId` and up to three authored `pinnedArtifactIds` to
`POST /api/gemini/challenge`. The server reconstructs the case from Casey's registry and
sends Gemini fictional artifact titles, source-root labels, source classes, and the
deterministic challenge kind.

The route rejects extra fields, unknown cases, unknown artifact IDs, duplicate IDs,
cross-origin requests, and more than three IDs. Gemini returns schema-constrained JSON.
Casey validates it again and replaces invalid, unavailable, rate-limited, or timed-out
responses with authored copy.

Do not send player names, leaderboard nicknames, transcripts, raw audio, verdicts,
scores, provider credentials, or free-form browser text to Gemini. Do not persist prompts
or model responses in Tiger Data.

## Verification

Run the automated boundary and deterministic challenge tests without consuming credits:

```sh
npm run test -- --run tests/engine/moriarty.test.ts tests/gemini/moriarty-challenge.test.ts
```

Then run the browser demo path at desktop and 390 px:

```sh
npm run test:e2e -- tests/e2e/demo-path.spec.ts
```

For a real local smoke test, finish a case, select **Invite Moriarty**, and confirm the
status reads **Gemini live**. Validate that an independent exhibit produces **Chain held**,
the circular Moriarty-Proof seal appears, and the score remains unchanged. Temporarily
remove the key and repeat; the status must read **Casey fallback** and the interaction
must remain playable.

Before claiming the Gemini integration in a deployed demo, repeat the smoke test on the
production HTTPS URL and record the date. A local success does not verify deployment.

## Judge explanation

“ElevenLabs supplies the persuasive caller. Gemini plays Moriarty and attacks the
player's reasoning. Casey's deterministic engine decides whether the evidence chain
survives, so generative AI makes the lesson adaptive without becoming the source of
truth.”
