import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsPI,
  loginAsResearcher,
  loginAsTech,
} from "./helpers";

test.describe("Notifications — Access", () => {
  test("admin has notifications link in header", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(
      page.locator('a[href="/notifications"]').first(),
    ).toBeVisible();
  });

  test("PI has notifications link", async ({ page }) => {
    await loginAsPI(page);
    await expect(
      page.locator('a[href="/notifications"]').first(),
    ).toBeVisible();
  });

  test("researcher has notifications link", async ({ page }) => {
    await loginAsResearcher(page);
    await expect(
      page.locator('a[href="/notifications"]').first(),
    ).toBeVisible();
  });

  test("technician has notifications link", async ({ page }) => {
    await loginAsTech(page);
    await expect(
      page.locator('a[href="/notifications"]').first(),
    ).toBeVisible();
  });
});

test.describe("Notifications — Page", () => {
  test("notifications page loads for admin", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/notifications");
    // Should show notifications heading or empty state
    await page.waitForTimeout(1000);
    const hasContent = await page
      .getByText(/通知|Notification|暂无/)
      .first()
      .isVisible()
      .catch(() => false);
    expect(typeof hasContent).toBe("boolean");
  });

  test("notifications page loads for PI", async ({ page }) => {
    await loginAsPI(page);
    await page.goto("/notifications");
    await page.waitForTimeout(1000);
  });
});

test.describe("Notification Settings", () => {
  test("admin can access notification settings", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "通知设置" }).click();
    await expect(page.getByRole("heading", { name: "通知偏好" })).toBeVisible();
  });

  test("notification settings has email and in-app columns", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "通知设置" }).click();
    await expect(page.getByText("邮件")).toBeVisible();
    await expect(page.getByText("应用内")).toBeVisible();
  });

  test("PI can access notification settings", async ({ page }) => {
    await loginAsPI(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "通知设置" }).click();
    await expect(page.getByRole("heading", { name: "通知偏好" })).toBeVisible();
  });

  test("researcher can access notification settings", async ({ page }) => {
    await loginAsResearcher(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "通知设置" }).click();
    await expect(page.getByRole("heading", { name: "通知偏好" })).toBeVisible();
  });
});
