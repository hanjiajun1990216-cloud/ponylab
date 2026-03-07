import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Inventory", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/inventory");
  });

  test("page loads with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "库存管理" })).toBeVisible();
    await expect(page.getByText("管理试剂、耗材和设备库存")).toBeVisible();
  });

  test("action buttons visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "管理列" })).toBeVisible();
    await expect(page.getByRole("button", { name: "添加库存" })).toBeVisible();
  });

  test("displays seed inventory items", async ({ page }) => {
    await expect(page.getByText("LB Broth (Miller)")).toBeVisible();
    await expect(page.getByText("Ampicillin (100mg/mL)")).toBeVisible();
    await expect(page.getByText("SDS-PAGE gel (4-20%)")).toBeVisible();
    await expect(page.getByText("Anti-GFP antibody")).toBeVisible();
    await expect(page.getByText("IPTG (1M stock)")).toBeVisible();
  });

  test("table has correct columns", async ({ page }) => {
    await expect(
      page.getByRole("columnheader", { name: "物品" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "类别" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "当前数量" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "最低库存" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "状态" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "供应商" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "操作" }),
    ).toBeVisible();
  });

  test("adjust stock modal opens with correct item", async ({ page }) => {
    await page
      .getByRole("row", { name: /LB Broth/ })
      .getByRole("button")
      .click();
    await expect(
      page.getByRole("heading", { name: /调整库存.*LB Broth/ }),
    ).toBeVisible();
    await expect(page.getByText("2500 g").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "入库", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "出库", exact: true }),
    ).toBeVisible();
  });

  test("adjust modal switches between in/out", async ({ page }) => {
    await page
      .getByRole("row", { name: /LB Broth/ })
      .getByRole("button")
      .click();
    await expect(page.getByRole("button", { name: /确认入库/ })).toBeVisible();
    await page.getByRole("button", { name: "出库" }).click();
    await expect(page.getByRole("button", { name: /确认出库/ })).toBeVisible();
  });

  test("manage columns modal opens", async ({ page }) => {
    await page.getByRole("button", { name: "管理列" }).click();
    await expect(
      page.getByRole("heading", { name: "管理自定义列" }),
    ).toBeVisible();
    await expect(page.getByText("列名")).toBeVisible();
    await expect(page.getByText("类型")).toBeVisible();
    // Column type dropdown
    const select = page.getByRole("combobox");
    await expect(select).toBeVisible();
  });

  test("manage columns has all type options", async ({ page }) => {
    await page.getByRole("button", { name: "管理列" }).click();
    const select = page.getByRole("combobox");
    await expect(select.getByRole("option", { name: "文本" })).toBeAttached();
    await expect(select.getByRole("option", { name: "数字" })).toBeAttached();
    await expect(select.getByRole("option", { name: "日期" })).toBeAttached();
    await expect(
      select.getByRole("option", { name: "下拉选项" }),
    ).toBeAttached();
    await expect(select.getByRole("option", { name: "条形码" })).toBeAttached();
    await expect(select.getByRole("option", { name: "链接" })).toBeAttached();
  });
});
