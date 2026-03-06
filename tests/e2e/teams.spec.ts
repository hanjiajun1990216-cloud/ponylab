import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Teams List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/teams");
  });

  test("page loads with heading and create button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "团队管理" })).toBeVisible();
    await expect(page.getByRole("button", { name: "创建团队" })).toBeVisible();
  });

  test("displays seed team", async ({ page }) => {
    await expect(page.getByText("Biochemistry Lab")).toBeVisible();
    await expect(page.getByText("4 位成员")).toBeVisible();
    await expect(page.getByText("1 个项目")).toBeVisible();
  });

  test("team card links to detail", async ({ page }) => {
    await page.getByRole("link", { name: /Biochemistry Lab/ }).click();
    await expect(page).toHaveURL(/teams\//);
  });
});

test.describe("Team Detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/teams");
    await page.getByRole("link", { name: /Biochemistry Lab/ }).click();
    await expect(page).toHaveURL(/teams\//);
  });

  test("shows team header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Biochemistry Lab" })).toBeVisible();
    await expect(page.getByText("4 位成员")).toBeVisible();
  });

  test("has 4 tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: "成员", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "邀请", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "申请" })).toBeVisible();
    await expect(page.getByRole("button", { name: "设置" })).toBeVisible();
  });

  test("members tab shows all 4 members", async ({ page }) => {
    await expect(page.getByText("Sarah Chen")).toBeVisible();
    await expect(page.getByText("Alex Kim")).toBeVisible();
    await expect(page.getByText("Mike Johnson")).toBeVisible();
    await expect(page.getByRole("main").getByText("System Admin")).toBeVisible();
  });

  test("members tab has invite button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "邀请成员" })).toBeVisible();
  });

  test("members have role badges", async ({ page }) => {
    await expect(page.getByText("所有者")).toBeVisible();
    await expect(page.getByText("管理员")).toBeVisible();
    await expect(page.getByText("成员").first()).toBeVisible();
  });

  test("invitations tab works", async ({ page }) => {
    await page.getByRole("button", { name: "邀请", exact: true }).click();
    await expect(page.getByRole("button", { name: "创建邀请" })).toBeVisible();
  });

  test("applications tab works", async ({ page }) => {
    await page.getByRole("button", { name: "申请" }).click();
    await expect(page.getByText("暂无申请")).toBeVisible();
  });

  test("settings tab has editable fields", async ({ page }) => {
    await page.getByRole("button", { name: "设置" }).click();
    await expect(page.getByText("团队名称")).toBeVisible();
    await expect(page.getByText("描述")).toBeVisible();
    await expect(page.getByText("可见性")).toBeVisible();
    await expect(page.getByRole("button", { name: "保存更改" })).toBeVisible();
    // Visibility dropdown
    const select = page.getByRole("combobox");
    await expect(select.getByRole("option", { name: "公开" })).toBeAttached();
    await expect(select.getByRole("option", { name: "私密" })).toBeAttached();
    await expect(select.getByRole("option", { name: "仅邀请" })).toBeAttached();
  });
});
