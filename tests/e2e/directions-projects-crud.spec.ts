import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsPI } from "./helpers";

test.describe("Directions List — Layout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/directions");
  });

  test("shows page heading and subtitle", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "研究方向", exact: true })).toBeVisible();
    await expect(page.getByText("管理团队研究方向和项目分类")).toBeVisible();
  });

  test("new direction button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "新建方向" }).first()).toBeVisible();
  });

  test("shows seed directions", async ({ page }) => {
    await expect(page.getByText("Recombinant Protein Production")).toBeVisible();
    await expect(page.getByText("CRISPR Gene Editing Pipeline")).toBeVisible();
  });

  test("direction cards show status badges", async ({ page }) => {
    await expect(page.getByText("ACTIVE").first()).toBeVisible();
    await expect(page.getByText("PAUSED")).toBeVisible();
  });

  test("direction cards show project count", async ({ page }) => {
    await expect(page.getByText(/\d+ 个项目/).first()).toBeVisible();
  });
});

test.describe("Directions — Create", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/directions");
    // Wait for seed directions to load (avoids empty state button conflict)
    await expect(page.getByText("Recombinant Protein Production")).toBeVisible();
  });

  test("create direction modal opens", async ({ page }) => {
    await page.getByRole("button", { name: "新建方向" }).first().click();
    await expect(page.getByText("新建研究方向")).toBeVisible();
    await expect(page.getByPlaceholder("例如：蛋白质折叠研究")).toBeVisible();
    await expect(page.getByPlaceholder("简要描述这个研究方向...")).toBeVisible();
  });

  test("create direction with valid data", async ({ page }) => {
    await page.getByRole("button", { name: "新建方向" }).first().click();
    const dirName = `E2E Direction ${Date.now()}`;
    await page.getByPlaceholder("例如：蛋白质折叠研究").fill(dirName);
    await page.getByPlaceholder("简要描述这个研究方向...").fill("Auto-generated for E2E testing");
    await page.getByRole("button", { name: "创建", exact: true }).click();
    await expect(page.getByText(dirName)).toBeVisible({ timeout: 5000 });
  });

  test("create direction validates empty name", async ({ page }) => {
    await page.getByRole("button", { name: "新建方向" }).first().click();
    await page.getByRole("button", { name: "创建", exact: true }).click();
    await expect(page.getByText("请输入方向名称")).toBeVisible();
  });

  test("cancel button closes modal", async ({ page }) => {
    await page.getByRole("button", { name: "新建方向" }).first().click();
    await page.getByRole("button", { name: "取消" }).click();
    await expect(page.getByText("新建研究方向")).not.toBeVisible();
  });
});

test.describe("Direction Detail — Navigation", () => {
  test("clicking direction card navigates to detail", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/directions");
    await page.getByText("Recombinant Protein Production").click();
    await expect(page).toHaveURL(/directions\//);
  });

  test("direction detail shows projects list", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/directions");
    await page.getByText("Recombinant Protein Production").click();
    await expect(page.getByText("Protein Expression Optimization")).toBeVisible();
  });
});

test.describe("Projects List — from Direction", () => {
  test("project card navigates to project detail", async ({ page }) => {
    await loginAsAdmin(page);
    // Navigate to project via direction detail (no /projects list page exists)
    await page.goto("/directions");
    await page.getByText("Recombinant Protein Production").click();
    await page.getByText("Protein Expression Optimization").click();
    await expect(page).toHaveURL(/projects\//);
    await expect(page.getByRole("heading", { name: "Protein Expression Optimization" })).toBeVisible();
  });
});

test.describe("Directions — PI Access", () => {
  test("PI can view and create directions", async ({ page }) => {
    await loginAsPI(page);
    await page.goto("/directions");
    await expect(page.getByText("Recombinant Protein Production")).toBeVisible();
    await expect(page.getByRole("button", { name: "新建方向" }).first()).toBeVisible();
  });

  test("PI can navigate to direction detail", async ({ page }) => {
    await loginAsPI(page);
    await page.goto("/directions");
    await page.getByText("Recombinant Protein Production").click();
    await expect(page).toHaveURL(/directions\//);
  });
});
