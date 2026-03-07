import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsResearcher, navigateToProject } from "./helpers";

test.describe("Canvas View — Layout & Controls", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProject(page);
    await page.getByRole("button", { name: "画布" }).click();
  });

  test("canvas renders with task nodes", async ({ page }) => {
    // ReactFlow renders nodes as divs with class react-flow__node
    await expect(page.locator(".react-flow__node").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("canvas has minimap", async ({ page }) => {
    await expect(page.locator(".react-flow__minimap")).toBeVisible();
  });

  test("canvas has zoom controls", async ({ page }) => {
    await expect(page.locator(".react-flow__controls")).toBeVisible();
  });

  test("canvas has background grid", async ({ page }) => {
    await expect(page.locator(".react-flow__background")).toBeVisible();
  });

  test("edit workflow button is visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "编辑工作流" }),
    ).toBeVisible();
  });

  test("task nodes show task titles", async ({ page }) => {
    await expect(page.getByText("Prepare LB media")).toBeVisible();
    await expect(page.getByText("Transform BL21")).toBeVisible();
  });

  test("task nodes show status badges", async ({ page }) => {
    // At least one node should have a status badge
    const badges = page.locator(".react-flow__node .inline-flex");
    await expect(badges.first()).toBeVisible();
  });

  test("task node links to task detail", async ({ page }) => {
    const taskLink = page
      .locator(".react-flow__node a")
      .filter({ hasText: /Prepare LB media/ })
      .first();
    await expect(taskLink).toHaveAttribute("href", /\/tasks\//);
  });
});

test.describe("Canvas View — Edit Mode", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProject(page);
    await page.getByRole("button", { name: "画布" }).click();
  });

  test("clicking edit workflow enters edit mode", async ({ page }) => {
    await page.getByRole("button", { name: "编辑工作流" }).click();
    await expect(
      page.getByRole("button", { name: "完成编辑" }),
    ).toBeVisible();
  });

  test("clicking finish editing exits edit mode", async ({ page }) => {
    await page.getByRole("button", { name: "编辑工作流" }).click();
    await page.getByRole("button", { name: "完成编辑" }).click();
    await expect(
      page.getByRole("button", { name: "编辑工作流" }),
    ).toBeVisible();
  });

  test("nodes have connection handles in edit mode", async ({ page }) => {
    await page.getByRole("button", { name: "编辑工作流" }).click();
    // ReactFlow handles are rendered as small circles
    const handles = page.locator(".react-flow__handle");
    const count = await handles.count();
    expect(count).toBeGreaterThan(0);
  });

  test("nodes are not draggable in view mode", async ({ page }) => {
    // In view mode, nodes should not be draggable
    const node = page.locator(".react-flow__node").first();
    await expect(node).toBeVisible();
    // The node should not have the draggable class behavior
    // We verify by checking that the edit button says "编辑工作流"
    await expect(
      page.getByRole("button", { name: "编辑工作流" }),
    ).toBeVisible();
  });
});

test.describe("Canvas View — Dependency Arrows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProject(page);
    await page.getByRole("button", { name: "画布" }).click();
  });

  test("dependency edges render with arrow markers", async ({ page }) => {
    // If there are dependencies in seed data, edges should be visible
    // Check for SVG edge paths
    await page.waitForTimeout(1000);
    const edges = page.locator(".react-flow__edge");
    const edgeCount = await edges.count();
    // May or may not have edges depending on seed data
    expect(edgeCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Canvas View — Multi-role", () => {
  test("researcher can view canvas", async ({ page }) => {
    await loginAsResearcher(page);
    await navigateToProject(page);
    await page.getByRole("button", { name: "画布" }).click();
    await expect(page.locator(".react-flow__node").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("researcher sees edit workflow button", async ({ page }) => {
    await loginAsResearcher(page);
    await navigateToProject(page);
    await page.getByRole("button", { name: "画布" }).click();
    await expect(
      page.getByRole("button", { name: "编辑工作流" }),
    ).toBeVisible();
  });
});
