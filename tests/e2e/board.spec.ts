import { expect, test } from "@playwright/test";

test("board stays playable when the shared store is down", async ({ page, request }) => {
  const api = await request.get("/api/board");
  expect(api.ok()).toBeTruthy();
  const payload = await api.json();
  expect(payload.unavailable).toBe(true);

  const forged = await request.post("/api/board", {
    data: {
      submissionId: "01994677-4a80-7a55-8dc2-0242ac120002",
      nickname: "Jordan",
      score: 9999,
      caseResults: {
        "case-01": { verdict: "scam", pinnedArtifactIds: ["offer-email"] },
      },
    },
  });
  expect(forged.status()).toBe(503);
  expect((await forged.json()).score).toBeUndefined();

  await page.addInitScript(() => {
    window.localStorage.setItem(
      "casey_progress_v1",
      JSON.stringify({
        version: 1,
        nickname: "Jordan",
        nicknameAsked: true,
        chips: 125,
        cases: {
          "case-01": {
            attempts: 1,
            bestScore: 75,
            cleared: true,
            lastVerdict: "scam",
            usedOutOfBand: false,
            clearedAt: "2026-09-13T00:00:00.000Z",
            firstAttemptCorrect: true,
            pinnedArtifactIds: ["offer-email"],
            bestHand: "High card",
            lastHand: "High card",
            lastStake: 25,
          },
        },
      }),
    );
  });

  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "The Deduction Ledger" })).toBeVisible();
  await expect(
    page.getByText("Showing your local scores. The shared board is unavailable."),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: /Jordan/ })).toBeVisible();
  await expect(page.getByText(/@Jordan-[A-F0-9]{6}/).first()).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Best hand" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Chips" })).toBeVisible();
  await expect(page.getByText("You", { exact: true })).toBeVisible();
  await expect(page.getByText("Scores are verified server-side.")).toBeVisible();
});

test("board empty state hides the zero stat strip", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "casey_progress_v1",
      JSON.stringify({
        version: 1,
        nickname: null,
        nicknameAsked: false,
        chips: 100,
        cases: {},
      }),
    );
  });
  await page.goto("/board");
  await expect(page.getByText("No hands played yet")).toBeVisible();
  await expect(page.getByText("Finish a case and the first row is yours")).toBeVisible();
  await expect(page.getByRole("link", { name: "Deal Case 01" })).toBeVisible();
  await expect(page.getByText("Detectives tonight")).toHaveCount(0);
  await expect(page.getByText("Players tonight")).toHaveCount(0);
});
