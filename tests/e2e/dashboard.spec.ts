import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("displays welcome heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("你好");
  });

  test("shows 4 stat cards", async ({ page }) => {
    const main = page.getByRole("main");
    await expect(main.getByText("进行中项目")).toBeVisible();
    await expect(main.getByText("未读通知")).toBeVisible();
    await expect(main.getByText("库存预警").first()).toBeVisible();
    await expect(main.getByText("可用仪器")).toBeVisible();
  });

  test("shows activity blocks", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "待办 & 提醒" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "我的实验进度" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /仪器预约/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "库存预警" })).toBeVisible();
  });

  test("project progress link navigates to project", async ({ page }) => {
    const projectLink = page.getByRole("link", { name: /Protein Expression/ });
    await expect(projectLink).toBeVisible();
    await projectLink.click();
    await expect(page).toHaveURL(/projects\//);
  });

  test("sidebar navigation links are present", async ({ page }) => {
    const sidebar = page.getByRole("complementary");
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "研究方向" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "实验记录" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "样品" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "库存" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "仪器" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "协议" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "团队管理" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "审计日志" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "设置" })).toBeVisible();
  });

  test("notification bell link exists", async ({ page }) => {
    // Notification link is in sidebar, has /notifications URL
    await expect(page.locator('a[href="/notifications"]').first()).toBeVisible();
  });

  test("logout button exists", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("AI inventory prediction card shown", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "库存消耗预测" })).toBeVisible();
    await expect(page.getByRole("button", { name: "即将推出" })).toBeDisabled();
  });
});
