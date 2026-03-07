import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Directions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("directions page loads with heading", async ({ page }) => {
    await page.goto("/directions");
    await expect(page.getByRole("heading", { name: "研究方向", exact: true })).toBeVisible();
  });

  test("shows new direction button", async ({ page }) => {
    await page.goto("/directions");
    await expect(page.getByRole("button", { name: "新建方向" }).first()).toBeVisible();
  });

  test("displays seed direction card", async ({ page }) => {
    await page.goto("/directions");
    await expect(page.getByText("Recombinant Protein Production")).toBeVisible();
    await expect(page.getByText("ACTIVE").first()).toBeVisible();
    await expect(page.getByText("1 个项目")).toBeVisible();
  });

  test("direction card links to detail page", async ({ page }) => {
    await page.goto("/directions");
    await page.locator("a").filter({ hasText: /Recombinant Protein/ }).first().click();
    await expect(page).toHaveURL(/directions\//);
  });
});
