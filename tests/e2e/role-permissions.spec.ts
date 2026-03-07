import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsPI,
  loginAsResearcher,
  loginAsTech,
} from "./helpers";

test.describe("Admin Permissions — Full Access", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin can access team management", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.getByRole("heading", { name: "团队管理" })).toBeVisible();
    await expect(page.getByRole("button", { name: "创建团队" })).toBeVisible();
  });

  test("admin can access audit log", async ({ page }) => {
    await page.goto("/audit");
    await expect(page.getByText("审计日志")).toBeVisible();
  });

  test("admin can access all sidebar links", async ({ page }) => {
    const sidebar = page.getByRole("complementary");
    const links = [
      "Dashboard",
      "研究方向",
      "实验记录",
      "样品",
      "库存",
      "仪器",
      "协议",
      "团队管理",
      "审计日志",
      "设置",
    ];
    for (const link of links) {
      await expect(sidebar.getByRole("link", { name: link })).toBeVisible();
    }
  });

  test("admin can create directions", async ({ page }) => {
    await page.goto("/directions");
    await expect(
      page.getByRole("button", { name: "新建方向" }).first(),
    ).toBeVisible();
  });

  test("admin can create experiments", async ({ page }) => {
    await page.goto("/experiments");
    await expect(
      page.getByRole("button", { name: /新建实验/ }).first(),
    ).toBeVisible();
  });

  test("admin can manage inventory", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page.getByRole("heading", { name: "库存管理" })).toBeVisible();
  });

  test("admin can manage samples", async ({ page }) => {
    await page.goto("/samples");
    await expect(page.getByText("pET-28a-GFP plasmid")).toBeVisible();
  });

  test("admin can manage protocols", async ({ page }) => {
    await page.goto("/protocols");
    await expect(page.getByText("Bacterial Transformation")).toBeVisible();
  });

  test("admin can access instruments", async ({ page }) => {
    await page.goto("/instruments");
    await expect(page.getByText("UV-Vis Spectrophotometer")).toBeVisible();
  });

  test("admin can view notifications", async ({ page }) => {
    await expect(
      page.locator('a[href="/notifications"]').first(),
    ).toBeVisible();
  });
});

test.describe("PI Permissions — Project Leader", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPI(page);
  });

  test("PI can view dashboard with projects", async ({ page }) => {
    await expect(page.getByText(/Protein Expression/)).toBeVisible();
  });

  test("PI can access directions page", async ({ page }) => {
    await page.goto("/directions");
    await expect(
      page.getByRole("heading", { name: "研究方向", exact: true }),
    ).toBeVisible();
  });

  test("PI can access experiments page", async ({ page }) => {
    await page.goto("/experiments");
    await expect(
      page.getByRole("heading", { name: "实验记录", exact: true }),
    ).toBeVisible();
  });

  test("PI can access protocols page", async ({ page }) => {
    await page.goto("/protocols");
    await expect(page.getByText("Bacterial Transformation")).toBeVisible();
  });

  test("PI can access samples page", async ({ page }) => {
    await page.goto("/samples");
    await expect(page.getByText("pET-28a-GFP plasmid")).toBeVisible();
  });

  test("PI can access instruments page", async ({ page }) => {
    await page.goto("/instruments");
    await expect(page.getByText("UV-Vis Spectrophotometer")).toBeVisible();
  });

  test("PI can access inventory page", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page.getByRole("heading", { name: "库存管理" })).toBeVisible();
  });

  test("PI can access team management", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.getByText("Biochemistry Lab")).toBeVisible();
  });

  test("PI settings show correct name", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("input").first()).toHaveValue("Sarah");
  });
});

test.describe("Researcher Permissions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsResearcher(page);
  });

  test("researcher can view dashboard", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /你好/ })).toBeVisible();
  });

  test("researcher can view experiments", async ({ page }) => {
    await page.goto("/experiments");
    await expect(
      page.getByRole("heading", { name: "实验记录", exact: true }),
    ).toBeVisible();
  });

  test("researcher can view samples", async ({ page }) => {
    await page.goto("/samples");
    await expect(page.getByText("pET-28a-GFP plasmid")).toBeVisible();
  });

  test("researcher can view protocols", async ({ page }) => {
    await page.goto("/protocols");
    await expect(page.getByText("Bacterial Transformation")).toBeVisible();
  });

  test("researcher can view instruments", async ({ page }) => {
    await page.goto("/instruments");
    await expect(page.getByText("UV-Vis Spectrophotometer")).toBeVisible();
  });

  test("researcher can view inventory", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page.getByRole("heading", { name: "库存管理" })).toBeVisible();
  });

  test("researcher can view directions", async ({ page }) => {
    await page.goto("/directions");
    await expect(
      page.getByRole("heading", { name: "研究方向", exact: true }),
    ).toBeVisible();
  });

  test("researcher can view team page", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.getByText("Biochemistry Lab")).toBeVisible();
  });

  test("researcher settings show correct first name", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("input").first()).toHaveValue("Alex");
  });

  test("researcher can view audit log", async ({ page }) => {
    await page.goto("/audit");
    await expect(page.getByText("审计日志")).toBeVisible();
  });
});

test.describe("Technician Permissions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTech(page);
  });

  test("technician can access dashboard", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /你好/ })).toBeVisible();
  });

  test("technician can access instruments", async ({ page }) => {
    await page.goto("/instruments");
    await expect(page.getByText("UV-Vis Spectrophotometer")).toBeVisible();
  });

  test("technician can access inventory", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page.getByRole("heading", { name: "库存管理" })).toBeVisible();
  });

  test("technician can access samples", async ({ page }) => {
    await page.goto("/samples");
    await expect(page.getByText("pET-28a-GFP plasmid")).toBeVisible();
  });

  test("technician can access experiments", async ({ page }) => {
    await page.goto("/experiments");
    await expect(
      page.getByRole("heading", { name: "实验记录", exact: true }),
    ).toBeVisible();
  });

  test("technician can access protocols", async ({ page }) => {
    await page.goto("/protocols");
    await expect(page.getByText("Bacterial Transformation")).toBeVisible();
  });

  test("technician can access directions", async ({ page }) => {
    await page.goto("/directions");
    await expect(
      page.getByRole("heading", { name: "研究方向", exact: true }),
    ).toBeVisible();
  });

  test("technician settings show correct first name", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("input").first()).toHaveValue("Mike");
  });

  test("technician can access team page", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.getByText("Biochemistry Lab")).toBeVisible();
  });
});

test.describe("Cross-role Comparisons", () => {
  test("all 4 roles see the dashboard greeting", async ({ page }) => {
    const roles = [loginAsAdmin, loginAsPI, loginAsResearcher, loginAsTech];
    for (const loginFn of roles) {
      await loginFn(page);
      await expect(page.getByRole("heading", { name: /你好/ })).toBeVisible();
      await page.goto("/login");
    }
  });

  test("all roles see sidebar navigation", async ({ page }) => {
    const roles = [loginAsAdmin, loginAsPI, loginAsResearcher, loginAsTech];
    for (const loginFn of roles) {
      await loginFn(page);
      const sidebar = page.getByRole("complementary");
      await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
      await page.goto("/login");
    }
  });

  test("all roles can access settings", async ({ page }) => {
    const roles = [loginAsAdmin, loginAsPI, loginAsResearcher, loginAsTech];
    for (const loginFn of roles) {
      await loginFn(page);
      await page.goto("/settings");
      await expect(page.getByRole("heading", { name: "设置" })).toBeVisible();
      await page.goto("/login");
    }
  });
});
