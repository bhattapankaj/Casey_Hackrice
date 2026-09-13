import { expect, test } from "@playwright/test";

const PLAYER = JSON.stringify({ version: 1, name: "Jordan" });
const PROGRESS = JSON.stringify({
  version: 1,
  nickname: "Jordan-Hound-221B",
  nicknameAsked: true,
  chips: 100,
  cases: {},
});

test("table access requires both the player name and leaderboard nickname", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("link", { name: "Table", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByLabel("Leaderboard nickname")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose a case. Read every tell." })).toHaveCount(0);

  await page.evaluate((player) => {
    window.localStorage.setItem("casey.player.v1", player);
  }, PLAYER);
  await page.goto("/table");
  await expect(page).toHaveURL(/\/$/);

  await page.evaluate(({ progress }) => {
    window.localStorage.removeItem("casey.player.v1");
    window.localStorage.setItem("casey_progress_v1", progress);
  }, { progress: PROGRESS });
  await page.goto("/table");
  await expect(page).toHaveURL(/\/$/);

  await page.evaluate(({ player, progress }) => {
    window.localStorage.setItem("casey.player.v1", player);
    window.localStorage.setItem("casey_progress_v1", progress);
  }, { player: PLAYER, progress: PROGRESS });
  await page.goto("/table");
  await expect(page.getByRole("heading", { name: "Choose a case. Read every tell." })).toBeVisible();
});

test("case routes require the same player identity gate", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());

  await page.goto("/play/case-01");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Meridian Offer" })).toHaveCount(0);

  await page.evaluate(({ player, progress }) => {
    window.localStorage.setItem("casey.player.v1", player);
    window.localStorage.setItem("casey_progress_v1", progress);
  }, { player: PLAYER, progress: PROGRESS });
  await page.goto("/play/case-01");
  await expect(page.getByRole("heading", { name: "The Meridian Offer" })).toBeVisible();
});
