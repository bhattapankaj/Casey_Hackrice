# Casey — Devpost Submission

## Inspiration

A convincing email gives you a phone number. You call it, someone confirms the offer, and you feel reassured. But have you actually verified anything?

If the same person controls the email and the phone number, you have heard one story twice.

As a two-person team from ULM, we built Casey around that moment. We wanted to make independent verification something players could experience and practice. HackRice's casino and card theme gave us the setting: a table where confidence is easy to bring, but a strong hand requires evidence.

## What it does

Casey is a voice-first investigation game. You receive a suspicious job offer, speak with a persuasive fictional caller, investigate documents, and decide: Scam, Legitimate, or Not enough evidence.

You can pin only three pieces of evidence into your Trust Chain, so choosing what actually proves your case matters.

The central question is where that evidence came from. Calling the number inside the suspicious email leads back to the claimant. Finding a contact through an independently located staff directory provides a separate source.

After committing your verdict, Casey reveals your Receipt. It traces pinned evidence to its origins, exposes confirmations that share the same source, and explains the score. A correct guess earns less than a conclusion supported by independent evidence.

Players can then face an optional Gemini-powered cross-examination. Professor Moriarty examines the structured source information behind the pinned documents and challenges one weakness in the Trust Chain. Casey's deterministic engine evaluates the player's defense, so Gemini can question the reasoning but cannot change the evidence, verdict, or score.

The table uses felt, cream cards, and gold accents. Opened emails and directory pages resemble everyday software, making the investigation feel familiar. Players who cannot use a microphone can complete the same investigation through an authored text fallback.

## How we built it

We built Casey with Next.js, TypeScript, and Tailwind CSS, using Framer Motion for card interactions.

ElevenLabs Agents powers the conversational caller. A protected server endpoint handles call authorization so API credentials never reach the browser. The integration includes a validated client tool for dealing pressure cards, which reveal and explain the caller's persuasion tactics during the debrief.

We use the Gemini API for a bounded post-verdict feature. Gemini receives limited, fictional metadata about the player's pinned evidence and produces a schema-constrained Moriarty objection and follow-up question. The server validates its response, and an authored fallback keeps the challenge playable if the API is unavailable.

The investigation itself runs on an authored and validated case graph. That graph defines the artifacts, available actions, source relationships, and evidence supporting each verdict.

Case truth, challenge correctness, and scoring remain deterministic. ElevenLabs can vary the conversation, and Gemini can phrase a critical challenge, but neither model can invent evidence or decide whether the player is correct.

We use Vitest for engine, validation, and Gemini boundary tests. Playwright exercises the complete fallback demo path.

## Challenges we ran into

The hardest design problem was distinguishing a different communication channel from a genuinely different source. An email and a phone call can look like two confirmations while sharing one origin. We modeled those relationships explicitly so the Receipt could explain the difference.

We also had to make investigation require judgment. Opening every document should not automatically produce a strong case. Limiting the Trust Chain to three deliberately pinned artifacts makes evidence selection part of the experience.

Voice introduced another challenge: keeping an unpredictable conversation inside a fair, authored scenario. We separated dialogue from game authority, validated tool inputs, and built a text fallback so microphone or connection problems would not stop the round.

Gemini presented a similar boundary problem. We wanted its cross-examination to be creative and responsive without allowing it to alter the case. We solved this by giving Gemini only bounded source metadata, requiring structured output, validating every response, and leaving correctness entirely with Casey's deterministic engine.

## Accomplishments that we're proud of

We built a complete playable investigation, from the first offer to the final Receipt, with tested scoring and resilient fallbacks.

Our favorite moment is the source reveal. Two convincing pieces of evidence can collapse into one claimant-controlled story. That makes an abstract security lesson visible through the player's own choices.

We are also proud of how we used generative AI with clear responsibilities. ElevenLabs makes the caller adaptive, while Gemini challenges the player's reasoning after the verdict. Neither system controls the evidence or score.

We also made room for uncertainty. Players can choose Not enough evidence, and the game never rewards speed. Taking time to verify belongs in the experience.

## What we learned

Designing Casey taught us that the explanation following a decision deserves as much attention as the decision itself. A verdict tells players whether they were right. The Receipt shows whether their reasoning deserved their confidence.

We also learned how useful clear boundaries around generative AI can be. Conversation and cross-examination benefit from variation, while evidence and scoring require consistency. Separating those responsibilities made Casey safer, easier to test, and easier to explain.

Gemini also showed us that AI can contribute without being the final authority. It is most useful here as a challenger that encourages deeper reasoning, not as a system that decides what is true.

## What's next for Casey

Our next steps are validating the ElevenLabs and Gemini integrations in the deployed environment and conducting first-time player testing, especially to learn whether players can explain why two confirmations may still count as one source.

We want to expand beyond the first case with a legitimate offer that looks suspicious and a case where uncertainty is the correct outcome. Together, those scenarios would reward careful verification instead of reflexively labeling everything a scam.

We also want to explore privacy-conscious aggregate analytics to understand how players investigate without collecting raw conversations.

Casey's takeaway is simple: before you trust a claim, find a source the claimant does not control.
