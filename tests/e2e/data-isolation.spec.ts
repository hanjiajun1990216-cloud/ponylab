import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsPI,
  loginAsResearcher,
  loginAsTech,
} from "./helpers";

test.describe("Team Data Isolation — Same Team", () => {
  test("all roles in same team see same samples", async ({ page }) => {
    const roles = [loginAsAdmin, loginAsPI, loginAsResearcher, loginAsTech];
    for (const loginFn of roles) {
      await loginFn(page);
      await page.goto("/samples");
      await expect(page.getByText("pET-28a-GFP plasmid")).toBeVisible();
      await page.goto("/login");
    }
  });

  test("all roles in same team see same experiments", async ({ page }) => {
    const roles = [loginAsAdmin, loginAsPI, loginAsResearcher, loginAsTech];
    for (const loginFn of roles) {
      await loginFn(page);
      await page.goto("/experiments");
      await expect(page.getByText("GFP Expression")).toBeVisible();
      await page.goto("/login");
    }
  });

  test("all roles in same team see same instruments", async ({ page }) => {
    const roles = [loginAsAdmin, loginAsPI, loginAsResearcher, loginAsTech];
    for (const loginFn of roles) {
      await loginFn(page);
      await page.goto("/instruments");
      await expect(page.getByText("UV-Vis Spectrophotometer")).toBeVisible();
      await page.goto("/login");
    }
  });

  test("all roles in same team see same protocols", async ({ page }) => {
    const roles = [loginAsAdmin, loginAsPI, loginAsResearcher, loginAsTech];
    for (const loginFn of roles) {
      await loginFn(page);
      await page.goto("/protocols");
      await expect(page.getByText("Bacterial Transformation")).toBeVisible();
      await page.goto("/login");
    }
  });

  test("all roles see same inventory data", async ({ page }) => {
    const roles = [loginAsAdmin, loginAsPI, loginAsResearcher, loginAsTech];
    for (const loginFn of roles) {
      await loginFn(page);
      await page.goto("/inventory");
      await expect(
        page.getByRole("heading", { name: "库存管理" }),
      ).toBeVisible();
      await page.goto("/login");
    }
  });
});

test.describe("Team Data Isolation — Team Boundary", () => {
  test("team detail only shows team members", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/teams");
    await page
      .locator("a")
      .filter({ hasText: /Biochemistry Lab/ })
      .first()
      .click();
    // Should show exactly 4 members from seed
    await expect(page.getByText("4 位成员")).toBeVisible();
    await expect(page.getByText("Sarah Chen")).toBeVisible();
    await expect(page.getByText("Alex Kim")).toBeVisible();
    await expect(page.getByText("Mike Johnson")).toBeVisible();
  });

  test("team projects count is correct", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/teams");
    await expect(page.getByText("1 个项目")).toBeVisible();
  });
});

test.describe("Resource Scoping — Directions", () => {
  test("admin sees team directions", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/directions");
    await expect(
      page.getByRole("heading", { name: "研究方向", exact: true }),
    ).toBeVisible();
  });

  test("PI sees team directions", async ({ page }) => {
    await loginAsPI(page);
    await page.goto("/directions");
    await expect(
      page.getByRole("heading", { name: "研究方向", exact: true }),
    ).toBeVisible();
  });

  test("researcher sees team directions", async ({ page }) => {
    await loginAsResearcher(page);
    await page.goto("/directions");
    await expect(
      page.getByRole("heading", { name: "研究方向", exact: true }),
    ).toBeVisible();
  });

  test("technician sees team directions", async ({ page }) => {
    await loginAsTech(page);
    await page.goto("/directions");
    await expect(
      page.getByRole("heading", { name: "研究方向", exact: true }),
    ).toBeVisible();
  });
});

test.describe("Resource Scoping — Notifications", () => {
  test("admin has notifications link", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(
      page.locator('a[href="/notifications"]').first(),
    ).toBeVisible();
  });

  test("PI has notifications link", async ({ page }) => {
    await loginAsPI(page);
    await expect(
      page.locator('a[href="/notifications"]').first(),
    ).toBeVisible();
  });

  test("researcher has notifications link", async ({ page }) => {
    await loginAsResearcher(page);
    await expect(
      page.locator('a[href="/notifications"]').first(),
    ).toBeVisible();
  });

  test("technician has notifications link", async ({ page }) => {
    await loginAsTech(page);
    await expect(
      page.locator('a[href="/notifications"]').first(),
    ).toBeVisible();
  });
});

test.describe("Settings Isolation — Per User", () => {
  test("admin settings show System Admin name", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await expect(page.locator("input").first()).toHaveValue("System");
  });

  test("PI settings show Sarah name", async ({ page }) => {
    await loginAsPI(page);
    await page.goto("/settings");
    await expect(page.locator("input").first()).toHaveValue("Sarah");
  });

  test("researcher settings show Alex name", async ({ page }) => {
    await loginAsResearcher(page);
    await page.goto("/settings");
    await expect(page.locator("input").first()).toHaveValue("Alex");
  });

  test("technician settings show Mike name", async ({ page }) => {
    await loginAsTech(page);
    await page.goto("/settings");
    await expect(page.locator("input").first()).toHaveValue("Mike");
  });

  test("each user sees their own email in settings", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await expect(page.getByText("admin@ponylab.io")).toBeVisible();

    await page.goto("/login");
    await loginAsPI(page);
    await page.goto("/settings");
    await expect(page.getByText("pi@lab.edu")).toBeVisible();
  });
});
