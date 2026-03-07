import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Instruments List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/instruments");
  });

  test("page loads with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "仪器管理" })).toBeVisible();
  });

  test("register instrument button visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "注册仪器" })).toBeVisible();
  });

  test("view toggle buttons visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "列表视图" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "时间线视图" }),
    ).toBeVisible();
  });

  test("displays 3 seed instruments", async ({ page }) => {
    await expect(page.getByText("FPLC System")).toBeVisible();
    await expect(page.getByText("Incubator Shaker")).toBeVisible();
    await expect(page.getByText("UV-Vis Spectrophotometer")).toBeVisible();
  });

  test("instrument cards show details", async ({ page }) => {
    await expect(page.getByText("Cytiva")).toBeVisible();
    await expect(page.getByText("ÄKTA pure 25")).toBeVisible();
    await expect(page.getByText(/Room 30/).first()).toBeVisible();
  });

  test("instrument cards have action links", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "查看详情" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "预约" }).first(),
    ).toBeVisible();
  });

  test("timeline view renders calendar", async ({ page }) => {
    await page.getByRole("button", { name: "时间线视图" }).click();
    await expect(page.getByRole("button", { name: "今天" })).toBeVisible();
    await expect(page.getByRole("button", { name: "上一周" })).toBeVisible();
    await expect(page.getByRole("button", { name: "下一周" })).toBeVisible();
    // 3 instrument rows in timeline
    await expect(page.getByText("FPLC System")).toBeVisible();
    await expect(page.getByText("Incubator Shaker")).toBeVisible();
    await expect(page.getByText("UV-Vis Spectrophotometer")).toBeVisible();
  });
});

test.describe("Instrument Detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/instruments");
    await page.getByRole("link", { name: "查看详情" }).last().click();
    await expect(page).toHaveURL(/instruments\//);
  });

  test("shows instrument header info", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/AVAILABLE|IN_USE/)).toBeVisible();
  });

  test("has 4 tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: "预约日历" })).toBeVisible();
    await expect(page.getByRole("button", { name: "留言板" })).toBeVisible();
    await expect(page.getByRole("button", { name: "维护记录" })).toBeVisible();
    await expect(page.getByRole("button", { name: "使用统计" })).toBeVisible();
  });

  test("calendar tab shows week view", async ({ page }) => {
    await expect(page.getByRole("button", { name: "今天" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "周", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "月", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "日", exact: true }),
    ).toBeVisible();
  });

  test("message board tab has input form", async ({ page }) => {
    await page.getByRole("button", { name: "留言板" }).click();
    await expect(page.getByRole("button", { name: "通用" })).toBeVisible();
    await expect(page.getByRole("button", { name: "问题" })).toBeVisible();
    await expect(page.getByRole("button", { name: "建议" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "维护", exact: true }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("发表留言")).toBeVisible();
  });

  test("maintenance tab has add record button", async ({ page }) => {
    await page.getByRole("button", { name: "维护记录" }).click();
    await expect(page.getByRole("button", { name: "添加记录" })).toBeVisible();
  });

  test("breadcrumb navigates back", async ({ page }) => {
    await page.getByRole("main").getByRole("link", { name: "仪器" }).click();
    await expect(page).toHaveURL(/instruments$/);
  });
});
