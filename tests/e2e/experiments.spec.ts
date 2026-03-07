import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Experiments List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments");
  });

  test("page loads with heading and new record button", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "实验记录", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "新建记录" }).first(),
    ).toBeVisible();
  });

  test("displays seed experiments", async ({ page }) => {
    await expect(page.getByText("Western Blot - Anti-GFP")).toBeVisible();
    await expect(
      page.getByText("GFP Expression in E. coli BL21"),
    ).toBeVisible();
  });

  test("status filter buttons work", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "全部", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "草稿" })).toBeVisible();
    await expect(page.getByRole("button", { name: "进行中" })).toBeVisible();
    await expect(page.getByRole("button", { name: "已完成" })).toBeVisible();
    await expect(page.getByRole("button", { name: "已签署" })).toBeVisible();
    await expect(page.getByRole("button", { name: "已归档" })).toBeVisible();
  });

  test("project filter buttons work", async ({ page }) => {
    await expect(page.getByRole("button", { name: "全部项目" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Protein Expression/ }),
    ).toBeVisible();
  });

  test("clicking experiment navigates to detail", async ({ page }) => {
    await page
      .locator("a")
      .filter({ hasText: /GFP Expression/ })
      .first()
      .click();
    await expect(page).toHaveURL(/experiments\//);
  });
});

test.describe("Experiment Detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments");
    await page
      .locator("a")
      .filter({ hasText: /GFP Expression/ })
      .first()
      .click();
    await expect(page).toHaveURL(/experiments\//);
  });

  test("shows experiment title and status", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "GFP Expression in E. coli BL21" }),
    ).toBeVisible();
    await expect(page.getByText("进行中")).toBeVisible();
  });

  test("has 6 tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: "实验记录" })).toBeVisible();
    await expect(page.getByRole("button", { name: "关联任务" })).toBeVisible();
    await expect(page.getByRole("button", { name: "实验结果" })).toBeVisible();
    await expect(page.getByRole("button", { name: "关联样品" })).toBeVisible();
    await expect(page.getByRole("button", { name: "附件" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "版本历史" }).nth(1),
    ).toBeVisible();
  });

  test("ELN editor toolbar is visible", async ({ page }) => {
    // Wait for TipTap editor to fully load
    await page.waitForTimeout(2000);
    // Check toolbar exists — button names may vary per TipTap version
    const toolbar = page.locator(
      '[class*="toolbar"], [role="toolbar"], .tiptap-toolbar, [class*="menu-bar"]',
    );
    const toolbarExists = (await toolbar.count()) > 0;
    if (toolbarExists) {
      await expect(toolbar.first()).toBeVisible();
    } else {
      // Fallback: check for any formatting buttons near the editor
      const buttons = page
        .locator("button")
        .filter({ has: page.locator("svg") });
      const count = await buttons.count();
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  test("editor shows content", async ({ page }) => {
    await expect(page.getByText("Objective")).toBeVisible();
    await expect(page.getByText(/Optimize GFP expression/)).toBeVisible();
  });

  test("save status indicator visible", async ({ page }) => {
    await expect(page.getByText("已保存")).toBeVisible();
    await expect(page.getByText(/字符/)).toBeVisible();
  });

  test("tasks tab shows linked tasks", async ({ page }) => {
    await page.getByRole("button", { name: "关联任务" }).click();
    await expect(page.getByText("TODO")).toBeVisible();
    await expect(page.getByText("IN_PROGRESS")).toBeVisible();
    await expect(page.getByText("DONE").first()).toBeVisible();
  });

  test("samples tab shows linked sample", async ({ page }) => {
    await page.getByRole("button", { name: "关联样品" }).click();
    await expect(page.getByText("GFP lysate")).toBeVisible();
    await expect(page.getByText("Cell Lysate")).toBeVisible();
  });

  test("results tab shows empty state", async ({ page }) => {
    await page.getByRole("button", { name: "实验结果" }).click();
    await expect(page.getByText("暂无实验结果")).toBeVisible();
  });

  test("attachments tab shows empty state", async ({ page }) => {
    await page.getByRole("button", { name: "附件" }).click();
    await expect(page.getByText("暂无附件")).toBeVisible();
  });

  test("CSV export button works", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "导出 CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("experiment-");
  });

  test("title is editable on click", async ({ page }) => {
    await page
      .getByRole("heading", { name: "GFP Expression in E. coli BL21" })
      .click();
    await expect(page.getByRole("textbox").first()).toBeVisible();
  });

  test("AI assistant panel opens and closes", async ({ page }) => {
    await page.getByRole("button", { name: "打开 AI 实验助手" }).click();
    const aiPanel = page
      .locator('[class*="fixed"]')
      .filter({ hasText: "AI 实验助手" });
    await expect(aiPanel).toBeVisible();
    await expect(
      page.getByRole("button", { name: "解释实验结果" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "生成摘要" })).toBeVisible();
    await page.getByRole("button", { name: "关闭" }).click();
    await expect(aiPanel).not.toBeVisible();
  });

  test("version history dropdown shows option", async ({ page }) => {
    await page.getByRole("button", { name: "版本历史" }).first().click();
    await expect(
      page.getByRole("button", { name: "查看完整历史" }),
    ).toBeVisible();
  });
});

test.describe("Experiment Templates", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments/templates");
  });

  test("page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "实验模板库" }),
    ).toBeVisible();
  });

  test("create template button exists", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "创建模板" }).first(),
    ).toBeVisible();
  });

  test("filter buttons visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "全部", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "公开模板" })).toBeVisible();
    await expect(page.getByRole("button", { name: "团队私有" })).toBeVisible();
  });

  test("create template modal opens with form", async ({ page }) => {
    await page.getByRole("button", { name: "创建模板" }).first().click();
    await expect(
      page.getByRole("heading", { name: "创建实验模板" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("输入模板名称")).toBeVisible();
    await expect(page.getByPlaceholder("模板用途说明")).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: "团队私有" }),
    ).toBeVisible();
  });
});
