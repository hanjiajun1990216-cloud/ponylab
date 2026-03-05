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
      page.getByRole("button", { name: /sign in|login/i }),
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
    await page.getByRole("button", { name: /sign in|login/i }).click();
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("admin@ponylab.io");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|login/i }).click();
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
    await page.getByRole("button", { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test("dashboard displays stats and navigation", async ({ page }) => {
    // Check sidebar navigation links (use role to avoid strict mode)
    await expect(
      page.getByRole("link", { name: /experiment/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /sample/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /inventor/i }).first(),
    ).toBeVisible();
  });

  test("navigate to experiments page", async ({ page }) => {
    await page
      .getByRole("link", { name: /experiment/i })
      .first()
      .click();
    await expect(page).toHaveURL(/experiments/);
  });

  test("navigate to samples page", async ({ page }) => {
    await page
      .getByRole("link", { name: /sample/i })
      .first()
      .click();
    await expect(page).toHaveURL(/samples/);
  });

  test("navigate to inventory page", async ({ page }) => {
    await page
      .getByRole("link", { name: /inventor/i })
      .first()
      .click();
    await expect(page).toHaveURL(/inventory/);
  });

  test("navigate to protocols page", async ({ page }) => {
    await page
      .getByRole("link", { name: /protocol/i })
      .first()
      .click();
    await expect(page).toHaveURL(/protocols/);
  });

  test("navigate to instruments page", async ({ page }) => {
    await page
      .getByRole("link", { name: /instrument/i })
      .first()
      .click();
    await expect(page).toHaveURL(/instruments/);
  });

  test("navigate to audit page", async ({ page }) => {
    await page.getByRole("link", { name: /audit/i }).first().click();
    await expect(page).toHaveURL(/audit/);
  });
});
