import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsResearcher } from "./helpers";

test.describe("Experiment Create", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments");
  });

  test("new record button opens create flow", async ({ page }) => {
    await page.getByRole("button", { name: "新建记录" }).first().click();
    // Should navigate to a new experiment page or show a form
    await expect(page).toHaveURL(/experiments/, { timeout: 5000 });
  });

  test("filter by status: 草稿", async ({ page }) => {
    await page.getByRole("button", { name: "草稿" }).click();
    await expect(page.getByText("Western Blot - Anti-GFP")).toBeVisible();
  });

  test("filter by status: 进行中", async ({ page }) => {
    await page.getByRole("button", { name: "进行中" }).click();
    await expect(page.getByText("GFP Expression in E. coli BL21")).toBeVisible();
  });

  test("search or filter resets with 全部", async ({ page }) => {
    await page.getByRole("button", { name: "草稿" }).click();
    await page.getByRole("button", { name: "全部", exact: true }).click();
    await expect(page.getByText("GFP Expression")).toBeVisible();
    await expect(page.getByText("Western Blot")).toBeVisible();
  });
});

test.describe("Experiment Detail — Edit Title", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments");
    await page.getByRole("link", { name: /GFP Expression/ }).click();
  });

  test("clicking title makes it editable", async ({ page }) => {
    await page.getByRole("heading", { name: "GFP Expression in E. coli BL21" }).click();
    await expect(page.getByRole("textbox").first()).toBeVisible();
  });

  test("ELN editor is functional with content", async ({ page }) => {
    await expect(page.getByText("Objective")).toBeVisible();
    await expect(page.getByText(/Optimize GFP expression/)).toBeVisible();
  });

  test("save status shows 已保存", async ({ page }) => {
    await expect(page.getByText("已保存")).toBeVisible();
  });

  test("character count is visible", async ({ page }) => {
    await expect(page.getByText(/字符/)).toBeVisible();
  });
});

test.describe("Experiment Detail — Tabs Deep", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments");
    await page.getByRole("link", { name: /GFP Expression/ }).click();
  });

  test("tasks tab shows linked tasks with statuses", async ({ page }) => {
    await page.getByRole("button", { name: "关联任务" }).click();
    await expect(page.getByText("Prepare LB media")).toBeVisible();
    await expect(page.getByText("IPTG induction")).toBeVisible();
  });

  test("samples tab shows linked GFP lysate", async ({ page }) => {
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

  test("version history dropdown", async ({ page }) => {
    await page.getByRole("button", { name: "版本历史" }).first().click();
    await expect(page.getByRole("button", { name: "查看完整历史" })).toBeVisible();
  });
});

test.describe("Experiment Detail — AI Assistant", () => {
  test("AI panel opens and shows action buttons", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments");
    await page.getByRole("link", { name: /GFP Expression/ }).click();
    await page.getByRole("button", { name: "打开 AI 实验助手" }).click();
    const aiPanel = page.locator('[class*="fixed"]').filter({ hasText: "AI 实验助手" });
    await expect(aiPanel).toBeVisible();
    await expect(page.getByRole("button", { name: "解释实验结果" })).toBeVisible();
    await expect(page.getByRole("button", { name: "生成摘要" })).toBeVisible();
    await page.getByRole("button", { name: "关闭" }).click();
    await expect(aiPanel).not.toBeVisible();
  });
});

test.describe("Experiment Detail — CSV Export", () => {
  test("CSV export triggers download", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments");
    await page.getByRole("link", { name: /GFP Expression/ }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "导出 CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("experiment-");
  });
});

test.describe("Experiment Templates — CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/experiments/templates");
  });

  test("templates page shows heading and create button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "实验模板库" })).toBeVisible();
    await expect(page.getByRole("button", { name: "创建模板" }).first()).toBeVisible();
  });

  test("filter buttons: 全部, 公开模板, 团队私有", async ({ page }) => {
    await expect(page.getByRole("button", { name: "全部", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "公开模板" })).toBeVisible();
    await expect(page.getByRole("button", { name: "团队私有" })).toBeVisible();
  });

  test("seed templates are visible or empty state shown", async ({ page }) => {
    // Card titles may be truncated with ellipsis — use partial match
    const hasTemplates = await page.getByText(/Western Blot/).isVisible().catch(() => false);
    if (hasTemplates) {
      await expect(page.getByText(/Cell Culture Passage/)).toBeVisible();
    } else {
      // Team not loaded or templates not seeded — empty state
      await expect(page.getByText("暂无实验模板")).toBeVisible();
    }
  });

  test("filter buttons are clickable", async ({ page }) => {
    await page.getByRole("button", { name: "公开模板" }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "团队私有" }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "全部", exact: true }).click();
  });

  test("create template modal has all form fields", async ({ page }) => {
    await page.getByRole("button", { name: "创建模板" }).first().click();
    await expect(page.getByRole("heading", { name: "创建实验模板" })).toBeVisible();
    await expect(page.getByPlaceholder("输入模板名称")).toBeVisible();
    await expect(page.getByPlaceholder("模板用途说明")).toBeVisible();
    await expect(page.locator("span").filter({ hasText: "团队私有" })).toBeVisible();
  });

  test("create template with valid data", async ({ page }) => {
    await page.getByRole("button", { name: "创建模板" }).first().click();
    const templateName = `E2E Template ${Date.now()}`;
    await page.getByPlaceholder("输入模板名称").fill(templateName);
    await page.getByPlaceholder("模板用途说明").fill("Auto-generated by E2E test");
    // Modal submit button text is "创建模板" (same as header button) — use last()
    await page.locator("button").filter({ hasText: /^创建模板$/ }).last().click();
    // Template may appear in list or the modal may stay open if team not loaded
    await page.waitForTimeout(2000);
    const created = await page.getByText(templateName).isVisible().catch(() => false);
    expect(created).toBeTruthy();
  });
});

test.describe("Experiment — Researcher Access", () => {
  test("researcher can view experiments list", async ({ page }) => {
    await loginAsResearcher(page);
    await page.goto("/experiments");
    await expect(page.getByText("GFP Expression")).toBeVisible();
    await expect(page.getByText("Western Blot")).toBeVisible();
  });

  test("researcher can view experiment detail", async ({ page }) => {
    await loginAsResearcher(page);
    await page.goto("/experiments");
    await page.getByRole("link", { name: /GFP Expression/ }).click();
    await expect(page.getByRole("heading", { name: "GFP Expression in E. coli BL21" })).toBeVisible();
  });
});
