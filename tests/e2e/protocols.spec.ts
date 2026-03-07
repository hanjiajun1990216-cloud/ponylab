import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Protocols", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/protocols");
  });

  test("page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Protocols/i }),
    ).toBeVisible();
  });

  test("new protocol button visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "+ New Protocol" }),
    ).toBeVisible();
  });

  test("displays seed protocol", async ({ page }) => {
    await expect(
      page.getByText("Bacterial Transformation (Heat Shock)"),
    ).toBeVisible();
    await expect(page.getByText("Published")).toBeVisible();
    await expect(page.getByText("v1")).toBeVisible();
    await expect(page.getByText("Molecular Biology")).toBeVisible();
  });
});
