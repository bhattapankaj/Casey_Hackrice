import { expect, test } from "@playwright/test";

test("Case 01 fallback path reaches the deterministic Receipt", async ({ page }) => {
  await page.goto("/play/case-01");

  await expect(page.getByRole("heading", { name: /The Meridian Offer/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use microphone" })).toBeVisible();

  await page.getByRole("button", { name: "Play without microphone" }).click();
  await expect(page.getByText("Text call", { exact: true })).toBeVisible();
  await expect(page.getByLabel("1 pressure cards dealt")).toBeVisible();

  await page.locator("#card-offer-email").click();
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
  await page.getByRole("button", { name: "Submit verdict" }).click();
  await expect(page.getByRole("heading", { name: "Lock this verdict?" })).toBeVisible();
  await page.getByRole("button", { name: "Lock verdict" }).click();

  await expect(page.getByText("RECEIPT")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Truth: Scam" })).toBeVisible();
  await expect(page.getByText("Harlow University", { exact: true })).toBeVisible();
  await expect(page.getByText("Meridian claimant", { exact: true })).toBeVisible();
  await expect(page.getByText("2 pinned artifacts", { exact: true })).toBeVisible();
  await expect(page.getByText("1000 / 1,000", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Urgency" })).toBeVisible();
  await expect(
    page.getByText(/contact a number the claimant did not provide/),
  ).toBeVisible();
});
