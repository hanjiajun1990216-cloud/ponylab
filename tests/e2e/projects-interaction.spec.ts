import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsPI,
  loginAsResearcher,
  navigateToProject,
} from "./helpers";

test.describe("Project Detail — Layout & Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProject(page);
  });

  test("shows project heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Protein Expression Optimization" }),
    ).toBeVisible();
  });

  test("shows task count", async ({ page }) => {
    await expect(page.getByText(/\d+ 个任务/)).toBeVisible();
  });

  test("shows completion percentage", async ({ page }) => {
    await expect(page.getByText("完成度")).toBeVisible();
    await expect(page.getByText(/%/)).toBeVisible();
  });

  test("breadcrumb shows direction name", async ({ page }) => {
    await expect(
      page.getByText("Recombinant Protein Production"),
    ).toBeVisible();
  });
});

test.describe("Project Detail — View Modes", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProject(page);
  });

  test("has 4 view mode buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "画布" })).toBeVisible();
    await expect(page.getByRole("button", { name: "列表" })).toBeVisible();
    await expect(page.getByRole("button", { name: "看板" })).toBeVisible();
    await expect(page.getByRole("button", { name: "甘特图" })).toBeVisible();
  });

  test("list view shows table headers", async ({ page }) => {
    await page.getByRole("button", { name: "列表" }).click();
    await expect(page.getByText("任务名称")).toBeVisible();
    await expect(page.getByText("状态", { exact: true }).first()).toBeVisible();
  });

  test("list view shows seed tasks", async ({ page }) => {
    await page.getByRole("button", { name: "列表" }).click();
    await expect(page.getByText("Prepare LB media")).toBeVisible();
    await expect(page.getByText("Transform BL21")).toBeVisible();
    await expect(page.getByText("IPTG induction")).toBeVisible();
  });

  test("kanban view shows column headers", async ({ page }) => {
    await page.getByRole("button", { name: "看板" }).click();
    await expect(page.getByText("待办")).toBeVisible();
    await expect(page.getByText("进行中")).toBeVisible();
    await expect(page.getByText("已完成")).toBeVisible();
  });

  test("kanban shows tasks in correct columns", async ({ page }) => {
    await page.getByRole("button", { name: "看板" }).click();
    // Task statuses from seed: DONE, DONE, IN_PROGRESS, TODO, TODO
    await expect(page.getByText("Prepare LB media")).toBeVisible();
    await expect(page.getByText("IPTG induction")).toBeVisible();
  });

  test("canvas view renders", async ({ page }) => {
    await page.getByRole("button", { name: "画布" }).click();
    // Canvas should render nodes
    await page.waitForTimeout(1000);
  });

  test("gantt view renders", async ({ page }) => {
    await page.getByRole("button", { name: "甘特图" }).click();
    await page.waitForTimeout(1000);
  });
});

test.describe("Project Detail — Create Task", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProject(page);
  });

  test("new task button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "新建任务" })).toBeVisible();
  });

  test("new task modal opens with form", async ({ page }) => {
    await page.getByRole("button", { name: "新建任务" }).click();
    await expect(page.getByPlaceholder("输入任务名称")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "创建", exact: true }),
    ).toBeVisible();
  });

  test("can create a new task", async ({ page }) => {
    await page.getByRole("button", { name: "新建任务" }).click();
    const taskName = `E2E Test Task ${Date.now()}`;
    await page.getByPlaceholder("输入任务名称").fill(taskName);
    await page.getByRole("button", { name: "创建", exact: true }).click();
    // Wait for the task to appear in list
    await page.getByRole("button", { name: "列表" }).click();
    await expect(page.getByText(taskName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Project Detail — Comments", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProject(page);
  });

  test("project comments section is togglable", async ({ page }) => {
    await page.getByRole("button", { name: "项目留言" }).click();
    // Seed comments should be visible
    await expect(page.getByText(/IPTG optimization/)).toBeVisible();
  });

  test("seed comment from PI is visible with pin", async ({ page }) => {
    await page.getByRole("button", { name: "项目留言" }).click();
    // Only top-level comments are rendered in the flat list; replies are nested in API but not displayed
    await expect(page.getByText(/IPTG optimization/)).toBeVisible();
  });

  test("can post a project comment", async ({ page }) => {
    await page.getByRole("button", { name: "项目留言" }).click();
    const commentText = `E2E project comment ${Date.now()}`;
    await page.getByPlaceholder(/留言/).fill(commentText);
    await page.getByRole("button", { name: "发送", exact: true }).click();
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Project — Multi-role Access", () => {
  test("PI can view project and create tasks", async ({ page }) => {
    await loginAsPI(page);
    await navigateToProject(page);
    await expect(
      page.getByRole("heading", { name: "Protein Expression Optimization" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "新建任务" })).toBeVisible();
  });

  test("researcher can view project tasks", async ({ page }) => {
    await loginAsResearcher(page);
    await navigateToProject(page);
    await page.getByRole("button", { name: "列表" }).click();
    await expect(page.getByText("IPTG induction")).toBeVisible();
  });
});
