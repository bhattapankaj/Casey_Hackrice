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
      "casey.player.v1",
      JSON.stringify({ version: 1, name: "Jordan" }),
    );
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
  const register = page.getByRole("region", { name: "All investigators" });
  if ((page.viewportSize()?.width ?? 0) < 640) {
    const card = register.locator('[data-mobile-investigator^="Jordan-"]');
    await expect(card).toBeVisible();
    await expect(card.getByText(/@Jordan-[A-F0-9]{6}/)).toBeVisible();
    await expect(card.getByText("You", { exact: true })).toBeVisible();
  } else {
    const row = register.getByRole("row").filter({ hasText: "Jordan" });
    await expect(row).toBeVisible();
    await expect(row.getByText(/@Jordan-[A-F0-9]{6}/)).toBeVisible();
    await expect(row.getByText("You", { exact: true })).toBeVisible();
    await expect(register.getByRole("columnheader", { name: "Best hand" })).toBeVisible();
    await expect(register.getByRole("columnheader", { name: "Chips" })).toBeVisible();
  }
  await expect(page.getByText("Scores are verified server-side.")).toBeVisible();
});

test("board empty state hides the zero stat strip", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "casey.player.v1",
      JSON.stringify({ version: 1, name: "Jordan" }),
    );
    window.localStorage.setItem(
      "casey_progress_v1",
      JSON.stringify({
        version: 1,
        nickname: "Jordan-Hound-221B",
        nicknameAsked: true,
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

test("shared board shows every other investigator returned by Tiger", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "casey.player.v1",
      JSON.stringify({ version: 1, name: "Jordan" }),
    );
    window.localStorage.setItem(
      "casey_progress_v1",
      JSON.stringify({
        version: 1,
        nickname: "Jordan-Hound-221B",
        nicknameAsked: true,
        chips: 100,
        cases: {},
      }),
    );
  });

  await page.route("**/api/board", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        unavailable: false,
        entries: [
          {
            id: "b41d63e7-28f4-4c5e-91a2-6b7d8e9f0a12",
            nickname: "Avery",
            username: "Avery-B41D63",
            score: 950,
            casesCleared: 3,
            bestHand: "Straight",
            chips: 425,
            createdAt: "2026-09-13T01:00:00.000Z",
          },
          {
            id: "74ba9816-6cb8-4a02-bf40-c5473db0a91b",
            nickname: "Morgan",
            username: "Morgan-74BA98",
            score: 725,
            casesCleared: 2,
            bestHand: "Three of a kind",
            chips: 275,
            createdAt: "2026-09-13T02:00:00.000Z",
          },
        ],
        stats: { playersTonight: 2, casesPlayed: 5, case01WrongPercent: 0 },
      }),
    });
  });

  await page.goto("/board");
  await expect(page.getByText("Baker Street final table", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Avery, rank 1, Diamonds seat" }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Morgan, rank 2, Spades seat" }),
  ).toBeVisible();
  const register = page.getByRole("region", { name: "All investigators" });
  await expect(register).toBeVisible();
  await expect(page.getByText("2 players", { exact: true })).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) < 640) {
    await expect(register.locator('[data-mobile-investigator="Avery-B41D63"]')).toBeVisible();
    await expect(register.locator('[data-mobile-investigator="Morgan-74BA98"]')).toBeVisible();
  } else {
    await expect(register.getByRole("row").filter({ hasText: "Avery-B41D63" })).toBeVisible();
    await expect(register.getByRole("row").filter({ hasText: "Morgan-74BA98" })).toBeVisible();
  }
});

test("direct board access requires both a name and nickname", async ({ page }) => {
  let boardRequests = 0;
  await page.route("**/api/board", async (route) => {
    boardRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        unavailable: false,
        entries: [],
        stats: { playersTonight: 0, casesPlayed: 0, case01WrongPercent: 0 },
      }),
    });
  });

  await page.goto("/board");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByLabel("Leaderboard nickname")).toBeVisible();
  expect(boardRequests).toBe(0);

  await page.evaluate(() => {
    window.localStorage.setItem(
      "casey.player.v1",
      JSON.stringify({ version: 1, name: "Jordan" }),
    );
  });
  await page.goto("/board");
  await expect(page).toHaveURL(/\/$/);
  expect(boardRequests).toBe(0);

  await page.evaluate(() => {
    window.localStorage.setItem(
      "casey_progress_v1",
      JSON.stringify({
        version: 1,
        nickname: "Jordan-Hound-221B",
        nicknameAsked: true,
        chips: 100,
        cases: {},
      }),
    );
  });
  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "The Deduction Ledger" })).toBeVisible();
  await expect.poll(() => boardRequests).toBeGreaterThan(0);
});
