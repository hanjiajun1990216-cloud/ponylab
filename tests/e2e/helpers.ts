import { Page, expect } from "@playwright/test";

/** Retry wrapper for login — handles intermittent auth failures */
async function loginWithRetry(
  page: Page,
  email: string,
  password: string,
  maxRetries = 2,
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    try {
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
      return; // success
    } catch {
      if (attempt === maxRetries)
        throw new Error(
          `Login failed for ${email} after ${maxRetries + 1} attempts`,
        );
      // Wait before retry
      await page.waitForTimeout(1000);
    }
  }
}

/** Login as admin and wait for dashboard redirect */
export async function loginAsAdmin(page: Page) {
  await loginWithRetry(page, "admin@ponylab.io", "admin123!");
}

/** Login as PI (Sarah Chen) */
export async function loginAsPI(page: Page) {
  await loginWithRetry(page, "pi@lab.edu", "pi123456!");
}

/** Login as researcher (Alex Kim) */
export async function loginAsResearcher(page: Page) {
  await loginWithRetry(page, "researcher@lab.edu", "research!");
}

/** Login as technician (Mike Johnson) */
export async function loginAsTech(page: Page) {
  await loginWithRetry(page, "tech@lab.edu", "tech1234!");
}

/** Navigate to the first project detail page (via dashboard — no /projects list page exists) */
export async function navigateToProject(page: Page) {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /Protein Expression/ }).click();
  await expect(page).toHaveURL(/projects\//);
}

/** Navigate to the first experiment detail page */
export async function navigateToExperiment(page: Page) {
  await page.goto("/experiments");
  await page.getByRole("link", { name: /GFP Expression/ }).click();
  await expect(page).toHaveURL(/experiments\//);
}

/** Navigate to UV-Vis Spectrophotometer detail page (instrument names are h3 text, not links) */
export async function navigateToInstrument(page: Page) {
  await page.goto("/instruments");
  // Instrument cards have "查看详情" links; UV-Vis is the last card
  await page.getByRole("link", { name: "查看详情" }).last().click();
  await expect(page).toHaveURL(/instruments\//);
}
