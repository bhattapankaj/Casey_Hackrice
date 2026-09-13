import { expect, test } from "@playwright/test";

test("board stays playable when the shared store is down", async ({ page, request }) => {
  const api = await request.get("/api/board");
  expect(api.ok()).toBeTruthy();
  const payload = await api.json();
  expect(payload.unavailable).toBe(true);

  const forged = await request.post("/api/board", {
    data: {
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
          },
        },
      }),
    );
  });

  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "The board" })).toBeVisible();
  await expect(
    page.getByText("Showing your local scores. The shared board is unavailable."),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: /Jordan/ })).toBeVisible();
  await expect(page.getByText("You")).toBeVisible();
});
