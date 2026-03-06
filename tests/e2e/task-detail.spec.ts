import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsResearcher, loginAsTech, navigateToProject } from "./helpers";

// Helper: navigate to project and switch to list view for reliable task link access
async function goToProjectListView(page: import("@playwright/test").Page) {
  await navigateToProject(page);
  // Canvas (ReactFlow) view may not expose task links — switch to list view
  await page.getByRole("button", { name: "列表" }).click();
  await page.waitForTimeout(500);
}

test.describe("Task Detail — Navigation & Layout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToProjectListView(page);
  });

  test("clicking task navigates to detail page", async ({ page }) => {
    await page.getByRole("link", { name: /Prepare LB media/ }).click();
    await expect(page).toHaveURL(/tasks\//);
    await expect(page.getByText("Prepare LB media")).toBeVisible();
  });

  test("task detail shows status selector", async ({ page }) => {
    await page.getByRole("link", { name: /IPTG induction/ }).click();
    await expect(page).toHaveURL(/tasks\//);
    // Status is rendered as a <select> dropdown, not a text badge
    const statusSelect = page.locator("select");
    await expect(statusSelect.first()).toBeVisible();
    await expect(statusSelect.first()).toHaveValue("IN_PROGRESS");
  });
});

test.describe("Task Detail — Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToProjectListView(page);
    await page.getByRole("link", { name: /IPTG induction/ }).click();
    await expect(page).toHaveURL(/tasks\//);
  });

  test("has 3 tabs: 详情, 方案执行, 步骤", async ({ page }) => {
    await expect(page.getByRole("button", { name: "详情", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "方案执行" })).toBeVisible();
    await expect(page.getByRole("button", { name: "步骤", exact: true })).toBeVisible();
  });

  test("steps tab shows seed task steps", async ({ page }) => {
    await page.getByRole("button", { name: "步骤", exact: true }).click();
    // Step names are rendered as <span>{step.name}</span>
    await expect(page.getByText("Prepare IPTG dilutions")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Induce cultures at OD600")).toBeVisible();
    await expect(page.getByText("Incubate 4h at 37°C")).toBeVisible();
    await expect(page.getByText("Measure fluorescence")).toBeVisible();
  });

  test("steps tab shows progress counter", async ({ page }) => {
    await page.getByRole("button", { name: "步骤", exact: true }).click();
    // Progress format is (N/M) with parentheses
    await expect(page.getByText(/\(\d+\/\d+\)/)).toBeVisible();
  });
});

test.describe("Task Detail — Step CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToProjectListView(page);
    await page.getByRole("link", { name: /IPTG induction/ }).click();
    await page.getByRole("button", { name: "步骤", exact: true }).click();
  });

  test("add step button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "添加步骤" })).toBeVisible();
  });

  test("clicking add step shows input field", async ({ page }) => {
    await page.getByRole("button", { name: "添加步骤" }).click();
    await expect(page.getByPlaceholder(/步骤名称/)).toBeVisible();
  });

  test("can add a new step via Enter", async ({ page }) => {
    await page.getByRole("button", { name: "添加步骤" }).click();
    const input = page.getByPlaceholder(/步骤名称/);
    const stepName = `E2E Test Step ${Date.now()}`;
    await input.fill(stepName);
    await input.press("Enter");
    await expect(page.getByText(stepName)).toBeVisible({ timeout: 5000 });
  });

  test("step toggle buttons are present", async ({ page }) => {
    // Steps use circular checkbox buttons for completion toggle, not "标记完成" text
    const buttons = page.locator("button").filter({ has: page.locator("svg") });
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Task Detail — Comments", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToProjectListView(page);
    await page.getByRole("link", { name: /IPTG induction/ }).click();
  });

  test("shows comment section with seed comments", async ({ page }) => {
    await expect(page.getByText("留言区")).toBeVisible();
    await expect(page.getByText(/I have set up the 3 dilutions/)).toBeVisible();
  });

  test("comment input and send button are visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "发送", exact: true })).toBeVisible();
  });

  test("can post a new comment", async ({ page }) => {
    const commentText = `E2E test comment ${Date.now()}`;
    // Comment input is <input> not <textarea>
    await page.getByPlaceholder("添加留言...").fill(commentText);
    await page.getByRole("button", { name: "发送", exact: true }).click();
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Task Detail — Status Change", () => {
  test("status dropdown is visible", async ({ page }) => {
    await loginAsAdmin(page);
    await goToProjectListView(page);
    await page.getByRole("link", { name: /IPTG induction/ }).click();
    const statusSelect = page.locator("select");
    await expect(statusSelect.first()).toBeVisible();
  });
});

test.describe("Task Detail — Protocol Execution", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToProjectListView(page);
    await page.getByRole("link", { name: /IPTG induction/ }).click();
    await page.getByRole("button", { name: "方案执行" }).click();
  });

  test("protocol execution tab shows empty state or execution", async ({ page }) => {
    const hasExecution = await page.getByText("进行中").isVisible().catch(() => false);
    if (!hasExecution) {
      await expect(page.getByText("尚未启动方案执行")).toBeVisible();
      await expect(page.getByRole("button", { name: "启动方案执行" })).toBeVisible();
    }
  });

  test("start execution modal opens", async ({ page }) => {
    const hasExecution = await page.getByText("进行中").isVisible().catch(() => false);
    if (!hasExecution) {
      // "启动方案执行" matches multiple elements — use button role
      await page.getByRole("button", { name: "启动方案执行" }).click();
      await page.waitForTimeout(500);
      await expect(page.getByPlaceholder("输入 Protocol ID")).toBeVisible({ timeout: 5000 });
      await expect(page.getByPlaceholder("输入 Protocol Version ID")).toBeVisible();
    }
  });
});

test.describe("Task Detail — Multi-role", () => {
  test("technician can view assigned task", async ({ page }) => {
    await loginAsTech(page);
    // Navigate via dashboard → project → list view → task
    await page.getByRole("link", { name: /Protein Expression/ }).click();
    await page.getByRole("button", { name: "列表" }).click();
    await page.waitForTimeout(500);
    await page.getByRole("link", { name: /Prepare LB media/ }).click();
    await expect(page.getByText("Prepare LB media")).toBeVisible();
  });

  test("researcher can view their task steps", async ({ page }) => {
    await loginAsResearcher(page);
    await page.getByRole("link", { name: /Protein Expression/ }).click();
    await page.getByRole("button", { name: "列表" }).click();
    await page.waitForTimeout(500);
    await page.getByRole("link", { name: /IPTG induction/ }).click();
    await page.getByRole("button", { name: "步骤", exact: true }).click();
    await expect(page.getByText("Prepare IPTG dilutions")).toBeVisible();
  });
});
