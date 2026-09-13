import { expect, test } from "@playwright/test";
import { PLAYER_PROFILE_STORAGE_KEY } from "@/lib/player-profile";

test("Case 01 fallback path reaches the deterministic Receipt", async ({ page }) => {
  const boardSubmissions: Array<Record<string, unknown>> = [];
  await page.route("**/api/gemini/challenge", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        source: "gemini",
        copy: {
          objection: "Three clues sit before us, but only one may have escaped the claimant's hand.",
          question: "Which pinned exhibit proves that your investigation reached a separate source?",
          successLine: "A separate origin. Your chain survives my objection, detective.",
          failureLine: "A different channel can still carry the claimant's own story.",
        },
      }),
    });
  });
  await page.route("**/api/board", async (route) => {
    if (route.request().method() === "POST") {
      boardSubmissions.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, score: 150, casesCleared: 1 }),
      });
      return;
    }
    await route.continue();
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByLabel("Your name").fill("Jordan");
  await expect(page.getByLabel("Leaderboard nickname")).toHaveValue(
    /^Jor[A-Za-z0-9]*-(Adler|Baker|Bohemian|Cipher|Deduction|Hound|Irregular|Lantern|Lestrade|Magnifier|Mycroft|Violin|Watson)-221B$/,
  );
  const firstAlias = await page.getByLabel("Leaderboard nickname").inputValue();
  await page.getByRole("button", { name: "Deal another alias" }).click();
  await expect(page.getByLabel("Leaderboard nickname")).not.toHaveValue(firstAlias);
  await page.getByLabel("Leaderboard nickname").fill("Jordan-Hound-221B");
  await page.getByRole("button", { name: "Deal me in" }).click();
  await expect(page).toHaveURL(/\/table$/);
  const meridian = page.getByRole("link", { name: /The Meridian Offer/ });
  await expect(meridian).toHaveAttribute("href", "/play/case-01");
  // Activate the link without pointer coordinates while its deal animation settles.
  await meridian.evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page).toHaveURL(/\/play\/case-01$/);
  expect(
    await page.evaluate((key) => window.localStorage.getItem(key), PLAYER_PROFILE_STORAGE_KEY),
  ).toBe(JSON.stringify({ version: 1, name: "Jordan" }));
  expect(
    await page.evaluate(() => JSON.parse(window.localStorage.getItem("casey_progress_v1") ?? "{}")),
  ).toMatchObject({ nickname: "Jordan-Hound-221B", nicknameAsked: true });

  await page.reload();

  await expect(page.getByRole("heading", { name: /The Meridian Offer/ })).toBeVisible();
  await expect(page.getByText("Jordan, you received a research assistant offer this morning.")).toBeVisible();
  await expect(page.getByText("Incoming", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Answer", exact: true })).toBeVisible();
  await expect(page.getByText("Answering uses your microphone. Nothing is recorded.")).toBeVisible();
  await page.getByRole("button", { name: "Show microphone details" }).click();
  await expect(page.getByText(/microphone audio to ElevenLabs/)).toBeVisible();
  await expect(page.getByText("Claimant route", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Independent route", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Meridian claimant", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await expect(page.getByText("Call declined", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "End call", exact: true })).toHaveCount(0);
  await expect(page.getByText("Text transcript", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Call transcript")).toContainText("Morgan Vale");

  await page.locator("#card-offer-email").click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "End the call" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Pin as evidence" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close the email" })
    .click();

  await page.getByRole("button", { name: /Call the supplied number/ }).click();
  await page.locator("#card-supplied-call").click();
  await page.getByRole("button", { name: "Pin as evidence" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close the call" })
    .click();

  await page.getByRole("button", { name: /Find Harlow's directory/ }).click();
  await page.getByRole("button", { name: /Call the directory-listed office/ }).click();

  await page.locator("#card-directory-call").click();
  await page.getByRole("button", { name: "Pin as evidence" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close the call" })
    .click();

  await page.getByRole("button", { name: "Call it a scam" }).click();
  await expect(page.getByRole("button", { name: "Stake 25, selected" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Stake 10" }).click();
  await expect(page.getByRole("button", { name: "Stake 10, selected" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Stake 25" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByRole("button", { name: "Stake 25" }).click();
  await page.getByRole("button", { name: "Submit verdict" }).click();
  await expect(page.getByRole("heading", { name: "Lock this verdict?" })).toBeVisible();
  await page.getByRole("button", { name: "Lock verdict" }).click();

  await expect(page.getByText("RECEIPT")).toBeVisible();
  await expect(page.getByText("Jordan, here is what your Trust Chain proved.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Truth: Scam" })).toBeVisible();
  await expect(page.getByText("Harlow University", { exact: true })).toBeVisible();
  await expect(page.getByText("Meridian claimant", { exact: true })).toBeVisible();
  await expect(page.getByText("2 pinned artifacts", { exact: true })).toBeVisible();
  await expect(page.getByText("1000 / 1,000", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Urgency" })).toBeVisible();
  await expect(
    page.getByText(/contact a number the claimant did not provide/),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Moriarty's Objection" })).toBeVisible();
  await page.getByRole("button", { name: "Invite Moriarty" }).click();
  await expect(page.getByText("GEMINI LIVE")).toBeVisible();
  await expect(page.getByText(/Three clues sit before us/)).toBeVisible();
  await page.getByRole("button", { name: /Directory-listed call/ }).click();
  await expect(page.getByText("CHAIN HELD")).toBeVisible();
  await expect(page.getByRole("img", { name: "Moriarty-Proof deduction badge" })).toBeVisible();
  await expect(page.getByText("1000 / 1,000", { exact: true }).first()).toBeVisible();
  await expect.poll(() => boardSubmissions.length).toBe(1);
  expect(boardSubmissions[0]).toMatchObject({
    nickname: "Jordan-Hound-221B",
    chips: 125,
    caseResults: {
      "case-01": {
        verdict: "scam",
        pinnedArtifactIds: ["offer-email", "supplied-call", "directory-call"],
      },
    },
  });
});
