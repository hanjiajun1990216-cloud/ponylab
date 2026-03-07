import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Authentication Boundary", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test("unauthenticated access to experiments redirects", async ({ page }) => {
    await page.goto("/experiments");
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test("unauthenticated access to settings redirects", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In", exact: true }),
    ).toBeVisible();
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("wrong@email.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    // Should show error message and stay on login
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login/);
  });

  test("empty email shows validation", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("404 — Non-existent Routes", () => {
  test("non-existent page shows 404 or redirects", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/nonexistent-page-xyz");
    // Either shows 404 page or redirects to dashboard
    const is404 = await page
      .getByText("404")
      .isVisible()
      .catch(() => false);
    const isRedirected = await page.url().includes("dashboard");
    expect(is404 || isRedirected).toBeTruthy();
  });

  test("non-existent experiment ID shows error", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments/nonexistent-id-12345");
    await page.waitForTimeout(2000);
    // Should show error state or redirect
    const hasError = await page
      .getByText(/不存在|not found|error/i)
      .isVisible()
      .catch(() => false);
    const isRedirected = !page.url().includes("nonexistent");
    expect(hasError || isRedirected).toBeTruthy();
  });

  test("non-existent instrument ID shows error", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/instruments/nonexistent-id-12345");
    await page.waitForTimeout(2000);
    const hasError = await page
      .getByText(/不存在|not found|error/i)
      .isVisible()
      .catch(() => false);
    const isRedirected = !page.url().includes("nonexistent");
    expect(hasError || isRedirected).toBeTruthy();
  });

  test("non-existent sample ID shows error", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/samples/nonexistent-id-12345");
    await page.waitForTimeout(2000);
    const hasError = await page
      .getByText(/not found|deleted|不存在/i)
      .isVisible()
      .catch(() => false);
    const isRedirected = !page.url().includes("nonexistent");
    expect(hasError || isRedirected).toBeTruthy();
  });
});

test.describe("Form Validation", () => {
  test("direction create requires name", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/directions");
    // Wait for data to load, then click the first "新建方向" button
    await expect(page.getByText("Recombinant Protein Production")).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "新建方向" }).first().click();
    await page.getByRole("button", { name: "创建", exact: true }).click();
    await expect(page.getByText("请输入方向名称")).toBeVisible();
  });

  test("settings password requires current password", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page
      .locator("main nav")
      .getByRole("button", { name: "修改密码" })
      .click();
    // Click the submit button (last "修改密码" button in DOM)
    await page.locator("button").filter({ hasText: "修改密码" }).last().click();
    await expect(page.getByText("请输入当前密码")).toBeVisible();
  });

  test("settings profile requires first name", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    const firstNameInput = page.locator("input").nth(0);
    await firstNameInput.clear();
    await page.getByRole("button", { name: "保存更改" }).click();
    await expect(page.getByText("请输入名字")).toBeVisible();
    // Restore
    await firstNameInput.fill("System");
    await page.getByRole("button", { name: "保存更改" }).click();
  });
});

test.describe("Navigation Edge Cases", () => {
  test("logo/brand navigates to dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments");
    // Click logo or brand name in sidebar
    const sidebar = page.locator("aside");
    const brand = sidebar.getByText("PonyLab").first();
    if (await brand.isVisible()) {
      await brand.click();
      await expect(page).toHaveURL(/dashboard/);
    }
  });

  test("sidebar navigation works for all pages", async ({ page }) => {
    await loginAsAdmin(page);
    const sidebar = page.locator("aside");

    // Navigate through sidebar links
    await sidebar.getByText("实验记录").click();
    await expect(page).toHaveURL(/experiments/);

    await sidebar.getByText("仪器").click();
    await expect(page).toHaveURL(/instruments/);

    await sidebar.getByText("库存").click();
    await expect(page).toHaveURL(/inventory/);
  });

  test("back navigation works from detail pages", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments");
    await page.waitForTimeout(1000);
    await page.getByRole("link", { name: /GFP Expression/ }).click();
    await expect(page).toHaveURL(/experiments\//, { timeout: 10000 });
    await page.goBack();
    await expect(page).toHaveURL(/experiments/, { timeout: 10000 });
  });
});
