import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Samples List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/samples");
  });

  test("page loads with heading and new sample button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Samples" })).toBeVisible();
    await expect(page.getByRole("button", { name: "+ New Sample" })).toBeVisible();
  });

  test("displays seed samples in table", async ({ page }) => {
    await expect(page.getByText("pET-28a-GFP plasmid")).toBeVisible();
    await expect(page.getByText("BL21(DE3) glycerol stock")).toBeVisible();
    await expect(page.getByText("GFP lysate - 0.5mM IPTG")).toBeVisible();
  });

  test("table has correct columns", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Type" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Barcode" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Storage" })).toBeVisible();
  });

  test("list/storage view toggle works", async ({ page }) => {
    await expect(page.getByRole("button", { name: "列表视图" })).toBeVisible();
    await expect(page.getByRole("button", { name: "存储视图" })).toBeVisible();
    await page.getByRole("button", { name: "存储视图" }).click();
    await expect(page.getByRole("heading", { name: "存储位置" })).toBeVisible();
  });

  test("new sample form opens and creates sample", async ({ page }) => {
    await page.getByRole("button", { name: "+ New Sample" }).click();
    await expect(page.getByPlaceholder("Sample name...")).toBeVisible();
    await expect(page.getByPlaceholder("Type (e.g., DNA, Protein)")).toBeVisible();
    // Fill and create
    const uniqueName = `PW-Test-${Date.now()}`;
    await page.getByPlaceholder("Sample name...").fill(uniqueName);
    await page.getByPlaceholder("Type (e.g., DNA, Protein)").fill("DNA");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test("clicking sample navigates to detail", async ({ page }) => {
    await page.getByRole("link", { name: "pET-28a-GFP plasmid" }).click();
    await expect(page).toHaveURL(/samples\//);
  });
});

test.describe("Sample Detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/samples");
    await page.getByRole("link", { name: "pET-28a-GFP plasmid" }).click();
    await expect(page).toHaveURL(/samples\//);
  });

  test("shows sample info and QR code", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "pET-28a-GFP plasmid" })).toBeVisible();
    await expect(page.getByText("Available")).toBeVisible();
    await expect(page.getByText("Plasmid", { exact: true })).toBeVisible();
    // QR code rendered as SVG or canvas
    await expect(page.locator("svg, canvas, img").first()).toBeVisible();
  });

  test("breadcrumb navigation works", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Samples" })).toBeVisible();
  });

  test("has 3 tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Events" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Metadata" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();
  });

  test("actions tab shows all action buttons", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(page.getByText("Check Out")).toBeVisible();
    await expect(page.getByText("Check In")).toBeVisible();
    await expect(page.getByText("Mark Consumed")).toBeVisible();
    await expect(page.getByText("Dispose")).toBeVisible();
    await expect(page.getByText("Add Note")).toBeVisible();
  });

  test("metadata tab works", async ({ page }) => {
    await page.getByRole("button", { name: "Metadata" }).click();
    await expect(page.getByText("No metadata available")).toBeVisible();
  });
});
