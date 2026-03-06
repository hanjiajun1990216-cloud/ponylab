import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Audit Log", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/audit");
  });

  test("page loads with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Audit Log/i })).toBeVisible();
  });

  test("table has correct columns", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: "Timestamp" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "User" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Action" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Entity" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Details" })).toBeVisible();
  });

  test("displays audit entries", async ({ page }) => {
    // Should have at least seed audit logs
    await expect(page.getByRole("row").nth(1)).toBeVisible();
    await expect(page.getByText(/CREATE|LOGIN|UPDATE|REGISTER/).first()).toBeVisible();
  });

  test("shows action emoji badges", async ({ page }) => {
    // Verify at least one emoji badge is rendered
    const badges = page.locator("td").filter({ hasText: /🟢|🔑|🔵|👤|📦/ });
    await expect(badges.first()).toBeVisible();
  });
});

test.describe("Settings - Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
  });

  test("page loads with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "设置", exact: true })).toBeVisible();
  });

  test("has 3 navigation tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: "个人信息" })).toBeVisible();
    await expect(page.getByRole("button", { name: "修改密码" })).toBeVisible();
    await expect(page.getByRole("button", { name: "通知设置" })).toBeVisible();
  });

  test("profile tab shows user info", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "个人信息" })).toBeVisible();
    await expect(page.getByText("admin@ponylab.io")).toBeVisible();
    await expect(page.getByRole("main").getByText("SUPER_ADMIN")).toBeVisible();
  });

  test("profile fields are editable", async ({ page }) => {
    const firstName = page.getByRole("textbox").nth(0);
    const lastName = page.getByRole("textbox").nth(1);
    await expect(firstName).toHaveValue("System");
    await expect(lastName).toHaveValue("Admin");
  });

  test("email field is disabled", async ({ page }) => {
    const emailField = page.getByRole("textbox").nth(2);
    await expect(emailField).toBeDisabled();
  });

  test("save button exists", async ({ page }) => {
    await expect(page.getByRole("button", { name: "保存更改" })).toBeVisible();
  });
});

test.describe("Settings - Password", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "修改密码" }).click();
  });

  test("shows password form fields", async ({ page }) => {
    await expect(page.getByPlaceholder("输入当前密码")).toBeVisible();
    await expect(page.getByPlaceholder("至少 6 位")).toBeVisible();
    await expect(page.getByPlaceholder("再次输入新密码")).toBeVisible();
  });

  test("has submit button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "修改密码" }).nth(1)).toBeVisible();
  });
});

test.describe("Settings - Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "通知设置" }).click();
  });

  test("shows notification preferences heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "通知偏好" })).toBeVisible();
  });

  test("shows email and in-app columns", async ({ page }) => {
    await expect(page.getByText("邮件")).toBeVisible();
    await expect(page.getByText("应用内")).toBeVisible();
  });
});
