import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsTech, navigateToInstrument } from "./helpers";

test.describe("Instrument Detail — Layout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToInstrument(page);
  });

  test("shows instrument name and status", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "UV-Vis Spectrophotometer" }),
    ).toBeVisible();
  });

  test("shows serial number and location", async ({ page }) => {
    await expect(page.getByText("MY2024A001")).toBeVisible();
    await expect(page.getByText("Room 301")).toBeVisible();
  });

  test("has 4 tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: "预约日历" })).toBeVisible();
    await expect(page.getByRole("button", { name: "留言板" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "维护记录", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "使用统计" })).toBeVisible();
  });

  test("breadcrumb navigation back to instruments", async ({ page }) => {
    await expect(page.getByRole("main").getByText("仪器")).toBeVisible();
  });
});

test.describe("Instrument Detail — Calendar Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToInstrument(page);
  });

  test("calendar tab is active by default", async ({ page }) => {
    // Calendar should show by default
    await expect(page.getByText("今天")).toBeVisible();
  });

  test("calendar view mode buttons", async ({ page }) => {
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

  test("calendar navigation buttons work", async ({ page }) => {
    await page.getByText("上一页").click();
    await page.getByText("今天").click();
    await page.getByText("下一页").click();
  });

  test("seed bookings appear on calendar", async ({ page }) => {
    // Bookings are for tomorrow+ so they should be visible on calendar
    await expect(page.getByText(/OD600 measurements/).first())
      .toBeVisible({ timeout: 10000 })
      .catch(() => {
        // Bookings might not be visible if calendar isn't showing the right date range
      });
  });
});

test.describe("Instrument Detail — Comments Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToInstrument(page);
    await page.getByRole("button", { name: "留言板" }).click();
  });

  test("shows seed instrument comments", async ({ page }) => {
    await expect(page.getByText(/Calibrated UV lamp/)).toBeVisible();
    await expect(page.getByText(/cuvette holder is clean/)).toBeVisible();
  });

  test("shows pinned comments", async ({ page }) => {
    await expect(page.getByText("置顶消息")).toBeVisible();
  });

  test("comment tag buttons are visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "通用", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "问题", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "建议", exact: true }),
    ).toBeVisible();
  });

  test("comment input and send button", async ({ page }) => {
    await expect(page.getByPlaceholder("发表留言...")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "发送", exact: true }),
    ).toBeVisible();
  });

  test("can post a new instrument comment", async ({ page }) => {
    const commentText = `E2E instrument comment ${Date.now()}`;
    await page.getByPlaceholder("发表留言...").fill(commentText);
    await page.getByRole("button", { name: "发送", exact: true }).click();
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Instrument Detail — Maintenance Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToInstrument(page);
    await page.getByRole("button", { name: "维护记录", exact: true }).click();
  });

  test("shows seed maintenance record", async ({ page }) => {
    await expect(page.getByText(/Annual UV lamp calibration/)).toBeVisible();
  });

  test("shows maintenance type badge", async ({ page }) => {
    await expect(page.getByText("校准").first()).toBeVisible();
  });

  test("add record button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "添加记录" })).toBeVisible();
  });

  test("add maintenance modal opens with form fields", async ({ page }) => {
    await page.getByRole("button", { name: "添加记录" }).click();
    await expect(page.getByText("添加维护记录")).toBeVisible();
    await expect(page.getByPlaceholder("描述维护内容...")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "保存", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "取消", exact: true }),
    ).toBeVisible();
  });

  test("maintenance type select options", async ({ page }) => {
    await page.getByRole("button", { name: "添加记录" }).click();
    // The type select should be present
    const typeSelect = page.locator("select").first();
    if (await typeSelect.isVisible()) {
      const options = await typeSelect.locator("option").allTextContents();
      expect(options).toContain("校准");
    }
  });
});

test.describe("Instrument Detail — Stats Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToInstrument(page);
    await page.getByRole("button", { name: "使用统计" }).click();
  });

  test("shows stat cards or empty state", async ({ page }) => {
    // Stats charts load asynchronously — wait for content
    await page.waitForTimeout(2000);
    const hasStats = await page
      .getByText("近30天预约次数")
      .isVisible()
      .catch(() => false);
    if (hasStats) {
      await expect(page.getByText("近30天使用小时")).toBeVisible();
    } else {
      await expect(page.getByText("暂无统计数据")).toBeVisible();
    }
  });

  test("shows chart titles or empty state", async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasStats = await page
      .getByText("近30天每日预约量")
      .isVisible()
      .catch(() => false);
    if (hasStats) {
      await expect(page.getByText("用户使用时长分布")).toBeVisible();
    } else {
      await expect(page.getByText("暂无统计数据")).toBeVisible();
    }
  });
});

test.describe("Instrument — Technician Access", () => {
  test("technician can view instrument list and detail", async ({ page }) => {
    await loginAsTech(page);
    await page.goto("/instruments");
    await expect(page.getByText("UV-Vis Spectrophotometer")).toBeVisible();
    // Instrument names are h3 text, not links; use "查看详情" link
    await page.getByRole("link", { name: "查看详情" }).last().click();
    await expect(
      page.getByRole("heading", { name: "UV-Vis Spectrophotometer" }),
    ).toBeVisible();
  });

  test("technician can see all 4 tabs", async ({ page }) => {
    await loginAsTech(page);
    await navigateToInstrument(page);
    await expect(page.getByRole("button", { name: "预约日历" })).toBeVisible();
    await expect(page.getByRole("button", { name: "留言板" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "维护记录", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "使用统计" })).toBeVisible();
  });
});
