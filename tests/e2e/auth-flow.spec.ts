import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test("landing page loads with login link", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Ponylab/i);
    const loginLink = page.getByRole("link", {
      name: /login|sign in|get started/i,
    });
    await expect(loginLink).toBeVisible();
  });

  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /sign in|login/i }),
    ).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In", exact: true }),
    ).toBeVisible();
  });

  test("register page renders form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /register|sign up|create/i }),
    ).toBeVisible();
  });

  test("login with valid credentials redirects to dashboard", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("admin@ponylab.io");
    await page.locator('input[type="password"]').fill("admin123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("admin@ponylab.io");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    // Should show error message
    await expect(
      page.getByText(/invalid|error|failed|unauthorized/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test("unauthenticated user redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});

test.describe("Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("admin@ponylab.io");
    await page.locator('input[type="password"]').fill("admin123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test("dashboard displays stats and navigation", async ({ page }) => {
    const sidebar = page.getByRole("complementary");
    await expect(sidebar.getByRole("link", { name: "实验记录" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "样品" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "库存" })).toBeVisible();
  });

  test("navigate to experiments page", async ({ page }) => {
    await page.getByRole("complementary").getByRole("link", { name: "实验记录" }).click();
    await expect(page).toHaveURL(/experiments/);
  });

  test("navigate to samples page", async ({ page }) => {
    await page.getByRole("complementary").getByRole("link", { name: "样品" }).click();
    await expect(page).toHaveURL(/samples/);
  });

  test("navigate to inventory page", async ({ page }) => {
    await page.getByRole("complementary").getByRole("link", { name: "库存" }).click();
    await expect(page).toHaveURL(/inventory/);
  });

  test("navigate to protocols page", async ({ page }) => {
    await page.getByRole("complementary").getByRole("link", { name: "协议" }).click();
    await expect(page).toHaveURL(/protocols/);
  });

  test("navigate to instruments page", async ({ page }) => {
    await page.getByRole("complementary").getByRole("link", { name: "仪器" }).click();
    await expect(page).toHaveURL(/instruments/);
  });

  test("navigate to audit page", async ({ page }) => {
    await page.getByRole("complementary").getByRole("link", { name: "审计日志" }).click();
    await expect(page).toHaveURL(/audit/);
  });
});
