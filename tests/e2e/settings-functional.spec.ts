import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsResearcher, loginAsTech } from "./helpers";

test.describe("Settings — Profile Section", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
  });

  test("shows settings heading and subtitle", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "设置" })).toBeVisible();
    await expect(page.getByText("管理您的账户设置和偏好")).toBeVisible();
  });

  test("has 3 navigation tabs", async ({ page }) => {
    // Use nav inside main content to avoid matching sidebar nav
    const nav = page.locator("main nav");
    await expect(nav.getByRole("button", { name: "个人信息" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "修改密码" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "通知设置" })).toBeVisible();
  });

  test("profile form shows current user data", async ({ page }) => {
    // Admin user: firstName=System, lastName=Admin
    const firstNameInput = page.locator("input").nth(0);
    await expect(firstNameInput).toHaveValue("System");
  });

  test("email field is disabled", async ({ page }) => {
    await expect(page.getByText("邮箱地址无法修改")).toBeVisible();
  });

  test("save button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "保存更改" })).toBeVisible();
  });

  test("can update first name", async ({ page }) => {
    const firstNameInput = page.locator("input").nth(0);
    await firstNameInput.clear();
    await firstNameInput.fill("SystemUpdated");
    await page.getByRole("button", { name: "保存更改" }).click();
    await expect(page.getByText("已保存")).toBeVisible({ timeout: 5000 });
    // Restore original
    await firstNameInput.clear();
    await firstNameInput.fill("System");
    await page.getByRole("button", { name: "保存更改" }).click();
  });

  test("profile validates empty first name", async ({ page }) => {
    const firstNameInput = page.locator("input").nth(0);
    await firstNameInput.clear();
    await page.getByRole("button", { name: "保存更改" }).click();
    await expect(page.getByText("请输入名字")).toBeVisible();
  });
});

test.describe("Settings — Password Section", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page
      .locator("main nav")
      .getByRole("button", { name: "修改密码" })
      .click();
  });

  test("password form shows all fields", async ({ page }) => {
    await expect(page.getByPlaceholder("输入当前密码")).toBeVisible();
    await expect(page.getByPlaceholder("至少 6 位")).toBeVisible();
    await expect(page.getByPlaceholder("再次输入新密码")).toBeVisible();
  });

  test("change password submit button is visible", async ({ page }) => {
    // There are 2 "修改密码" buttons: nav tab + submit; submit is outside nav
    const submitBtn = page
      .locator("main button, section button")
      .filter({ hasText: "修改密码" });
    await expect(submitBtn.first()).toBeVisible();
  });

  test("validates empty current password", async ({ page }) => {
    // Click the submit button (not the nav button) — find by proximity to form fields
    const submitBtn = page
      .locator("button")
      .filter({ hasText: "修改密码" })
      .last();
    await submitBtn.click();
    await expect(page.getByText("请输入当前密码")).toBeVisible();
  });

  test("validates short new password", async ({ page }) => {
    await page.getByPlaceholder("输入当前密码").fill("admin123!");
    await page.getByPlaceholder("至少 6 位").fill("12345");
    const submitBtn = page
      .locator("button")
      .filter({ hasText: "修改密码" })
      .last();
    await submitBtn.click();
    await expect(page.getByText("新密码至少 6 位")).toBeVisible();
  });

  test("validates password mismatch", async ({ page }) => {
    await page.getByPlaceholder("输入当前密码").fill("admin123!");
    await page.getByPlaceholder("至少 6 位").fill("newpass123");
    await page.getByPlaceholder("再次输入新密码").fill("different123");
    const submitBtn = page
      .locator("button")
      .filter({ hasText: "修改密码" })
      .last();
    await submitBtn.click();
    await expect(page.getByText("两次密码不一致")).toBeVisible();
  });
});

test.describe("Settings — Notification Preferences", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page
      .locator("main nav")
      .getByRole("button", { name: "通知设置" })
      .click();
  });

  test("shows notification preferences heading", async ({ page }) => {
    await expect(page.getByText("通知偏好")).toBeVisible();
  });

  test("shows column headers: 邮件, 应用内", async ({ page }) => {
    await expect(page.getByText("邮件")).toBeVisible();
    await expect(page.getByText("应用内")).toBeVisible();
  });

  test("shows notification types", async ({ page }) => {
    await expect(page.getByText("任务分配通知")).toBeVisible();
    await expect(page.getByText("仪器预约确认")).toBeVisible();
    await expect(page.getByText("库存预警通知")).toBeVisible();
    await expect(page.getByText("实验状态变更")).toBeVisible();
  });

  test("notification type descriptions are visible", async ({ page }) => {
    await expect(page.getByText("当有任务分配给我时通知")).toBeVisible();
    await expect(page.getByText("预约成功或取消时通知")).toBeVisible();
  });

  test("toggle switches are present", async ({ page }) => {
    // Each notification type has 2 toggles (email + in-app)
    // Checkboxes are sr-only (visually hidden) — use count not visibility
    await page.waitForTimeout(1000);
    const toggles = page.locator('input[type="checkbox"]');
    const count = await toggles.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });
});

test.describe("Settings — Multi-role Profile", () => {
  test("researcher sees their profile info", async ({ page }) => {
    await loginAsResearcher(page);
    await page.goto("/settings");
    const firstNameInput = page.locator("input").nth(0);
    await expect(firstNameInput).toHaveValue("Alex");
  });

  test("technician sees their profile info", async ({ page }) => {
    await loginAsTech(page);
    await page.goto("/settings");
    const firstNameInput = page.locator("input").nth(0);
    await expect(firstNameInput).toHaveValue("Mike");
  });
});
