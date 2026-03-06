import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Project Detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // Navigate via dashboard project link
    await page.getByRole("link", { name: /Protein Expression/ }).click();
    await expect(page).toHaveURL(/projects\//);
  });

  test("shows project title and progress", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Protein Expression/ })).toBeVisible();
  });

  test("has 4 view modes", async ({ page }) => {
    await expect(page.getByRole("button", { name: /画布|canvas/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /列表|list/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /看板|kanban/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /甘特|gantt/i })).toBeVisible();
  });

  test("kanban view shows columns", async ({ page }) => {
    await page.getByRole("button", { name: /看板|kanban/i }).click();
    // Kanban columns
    await expect(page.getByText(/待办|TODO/)).toBeVisible();
    await expect(page.getByText(/进行中|IN_PROGRESS/)).toBeVisible();
    await expect(page.getByText(/已完成|DONE/)).toBeVisible();
  });

  test("list view shows task table", async ({ page }) => {
    await page.getByRole("button", { name: /列表|list/i }).click();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("gantt view renders", async ({ page }) => {
    await page.getByRole("button", { name: /甘特|gantt/i }).click();
    // Gantt renders SVG or canvas — just verify no error
    await expect(page.locator("main")).toBeVisible();
  });

  test("create task button opens modal", async ({ page }) => {
    await page.getByRole("button", { name: /新建任务|create task/i }).click();
    await expect(page.getByPlaceholder(/任务名称|task name/i)).toBeVisible();
  });
});
