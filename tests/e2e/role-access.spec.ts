import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsPI,
  loginAsResearcher,
  loginAsTech,
} from "./helpers";

test.describe("RBAC — PI Role Access", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPI(page);
  });

  test("PI can access dashboard", async ({ page }) => {
    // Dashboard greeting: "你好，Sarah！" — no heading "仪表盘"
    // Next.js route announcer duplicates text — use heading role to avoid strict mode
    await expect(page.getByRole("heading", { name: /你好/ })).toBeVisible();
  });

  test("PI can access experiments", async ({ page }) => {
    await page.goto("/experiments");
    await expect(
      page.getByRole("heading", { name: "实验记录", exact: true }),
    ).toBeVisible();
  });

  test("PI can see projects on dashboard", async ({ page }) => {
    // Projects are listed on dashboard, no separate /projects page
    await expect(page.getByText(/Protein Expression/)).toBeVisible();
  });

  test("PI can access directions", async ({ page }) => {
    await page.goto("/directions");
    await expect(
      page.getByRole("heading", { name: "研究方向", exact: true }),
    ).toBeVisible();
  });

  test("PI can access teams", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.getByText("Biochemistry Lab")).toBeVisible();
  });

  test("PI can access instruments", async ({ page }) => {
    await page.goto("/instruments");
    await expect(page.getByText("UV-Vis Spectrophotometer")).toBeVisible();
  });

  test("PI can access inventory", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page.getByRole("heading", { name: "库存管理" })).toBeVisible();
  });

  test("PI can access settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "设置" })).toBeVisible();
  });
});

test.describe("RBAC — Researcher Role Access", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsResearcher(page);
  });

  test("Researcher can access dashboard", async ({ page }) => {
    // Next.js route announcer duplicates text — use heading role to avoid strict mode
    await expect(page.getByRole("heading", { name: /你好/ })).toBeVisible();
  });

  test("Researcher can access experiments", async ({ page }) => {
    await page.goto("/experiments");
    await expect(
      page.getByRole("heading", { name: "实验记录", exact: true }),
    ).toBeVisible();
  });

  test("Researcher can access samples", async ({ page }) => {
    await page.goto("/samples");
    await expect(page.getByText("pET-28a-GFP plasmid")).toBeVisible();
  });

  test("Researcher can access protocols", async ({ page }) => {
    await page.goto("/protocols");
    await expect(page.getByText("Bacterial Transformation")).toBeVisible();
  });

  test("Researcher can access their settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "设置" })).toBeVisible();
    await expect(page.locator("input").first()).toHaveValue("Alex");
  });

  test("Researcher can access audit log", async ({ page }) => {
    await page.goto("/audit");
    await expect(page.getByText("审计日志")).toBeVisible();
  });
});

test.describe("RBAC — Technician Role Access", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTech(page);
  });

  test("Technician can access dashboard", async ({ page }) => {
    // Next.js route announcer duplicates text — use heading role to avoid strict mode
    await expect(page.getByRole("heading", { name: /你好/ })).toBeVisible();
  });

  test("Technician can access instruments", async ({ page }) => {
    await page.goto("/instruments");
    await expect(page.getByText("UV-Vis Spectrophotometer")).toBeVisible();
  });

  test("Technician can access inventory", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page.getByRole("heading", { name: "库存管理" })).toBeVisible();
  });

  test("Technician can access samples", async ({ page }) => {
    await page.goto("/samples");
    await expect(page.getByText("pET-28a-GFP plasmid")).toBeVisible();
  });

  test("Technician can access experiments", async ({ page }) => {
    await page.goto("/experiments");
    await expect(
      page.getByRole("heading", { name: "实验记录", exact: true }),
    ).toBeVisible();
  });

  test("Technician settings show correct user info", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("input").first()).toHaveValue("Mike");
  });
});

test.describe("RBAC — Cross-role comparison", () => {
  test("all 4 roles can login successfully", async ({ page }) => {
    // Admin
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/dashboard/);
    await page.goto("/login");

    // PI
    await loginAsPI(page);
    await expect(page).toHaveURL(/dashboard/);
    await page.goto("/login");

    // Researcher
    await loginAsResearcher(page);
    await expect(page).toHaveURL(/dashboard/);
    await page.goto("/login");

    // Technician
    await loginAsTech(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test("admin sees all sidebar items", async ({ page }) => {
    await loginAsAdmin(page);
    const sidebar = page.locator("aside");
    // Sidebar nav text: "Dashboard", "研究方向", "实验记录", etc.
    await expect(sidebar.getByText("Dashboard")).toBeVisible();
    await expect(sidebar.getByText("实验记录")).toBeVisible();
    await expect(sidebar.getByText("仪器")).toBeVisible();
    await expect(sidebar.getByText("设置")).toBeVisible();
  });
});
