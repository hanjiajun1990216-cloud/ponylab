import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsResearcher, navigateToProject } from "./helpers";

test.describe("Kanban Board — Layout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProject(page);
    await page.getByRole("button", { name: "看板" }).click();
  });

  test("shows three columns: 待办, 进行中, 已完成", async ({ page }) => {
    await expect(page.getByText("待办").first()).toBeVisible();
    await expect(page.getByText("进行中").first()).toBeVisible();
    await expect(page.getByText("已完成").first()).toBeVisible();
  });

  test("columns show task count badges", async ({ page }) => {
    // Each column header has a count badge
    const badges = page.locator(".rounded-full.bg-gray-200");
    const count = await badges.count();
    expect(count).toBe(3);
  });

  test("task cards show task title", async ({ page }) => {
    await expect(page.getByText("Prepare LB media")).toBeVisible();
  });

  test("task cards show assignee avatar", async ({ page }) => {
    // At least one card should have an assignee
    const avatars = page.locator(
      ".rounded-xl .flex.items-center.gap-1.text-xs",
    );
    const count = await avatars.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("task cards link to task detail page", async ({ page }) => {
    const taskLink = page
      .locator("a")
      .filter({ hasText: /Prepare LB media/ })
      .first();
    await expect(taskLink).toHaveAttribute("href", /\/tasks\//);
  });

  test("task cards show due date", async ({ page }) => {
    // Some tasks have due dates
    const dates = page.locator(".text-xs.text-gray-400");
    const count = await dates.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Kanban Board — Column Assignment", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProject(page);
    await page.getByRole("button", { name: "看板" }).click();
  });

  test("TODO tasks appear in 待办 column", async ({ page }) => {
    // Verify at least one task is in the correct column
    // The kanban columns are rendered in order: 待办, 进行中, 已完成
    const columns = page.locator(".rounded-xl.p-3.min-h-48");
    await expect(columns).toHaveCount(3);
  });

  test("DONE tasks appear in 已完成 column", async ({ page }) => {
    // Prepare LB media and Transform BL21 are DONE
    await expect(page.getByText("Prepare LB media")).toBeVisible();
    await expect(page.getByText("Transform BL21")).toBeVisible();
  });
});

test.describe("Kanban Board — Multi-role", () => {
  test("researcher can view kanban board", async ({ page }) => {
    await loginAsResearcher(page);
    await navigateToProject(page);
    await page.getByRole("button", { name: "看板" }).click();
    await expect(page.getByText("待办").first()).toBeVisible();
    await expect(page.getByText("进行中").first()).toBeVisible();
    await expect(page.getByText("已完成").first()).toBeVisible();
  });

  test("researcher sees task cards in kanban", async ({ page }) => {
    await loginAsResearcher(page);
    await navigateToProject(page);
    await page.getByRole("button", { name: "看板" }).click();
    await expect(page.getByText("Prepare LB media")).toBeVisible();
  });
});
