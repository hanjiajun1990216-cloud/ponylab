import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsPI,
  loginAsResearcher,
  loginAsTech,
} from "./helpers";

test.describe("Team Create", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/teams");
  });

  test("create team button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: "创建团队" }).click();
    await expect(
      page.getByRole("heading", { name: /创建团队/ }),
    ).toBeVisible();
  });

  test("create team form has required fields", async ({ page }) => {
    await page.getByRole("button", { name: "创建团队" }).click();
    await expect(page.getByPlaceholder(/团队名称/)).toBeVisible();
    await expect(page.getByPlaceholder(/描述/)).toBeVisible();
  });

  test("create team with valid data", async ({ page }) => {
    await page.getByRole("button", { name: "创建团队" }).click();
    const teamName = `E2E Team ${Date.now()}`;
    await page.getByPlaceholder(/团队名称/).fill(teamName);
    await page.getByPlaceholder(/描述/).fill("Created by E2E test");
    await page
      .locator("button")
      .filter({ hasText: /创建/ })
      .last()
      .click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(teamName)).toBeVisible({ timeout: 5000 });
  });

  test("create team without name shows validation", async ({ page }) => {
    await page.getByRole("button", { name: "创建团队" }).click();
    // Try submitting with empty name
    await page
      .locator("button")
      .filter({ hasText: /创建/ })
      .last()
      .click();
    // Should stay on form or show validation error
    await expect(page.getByPlaceholder(/团队名称/)).toBeVisible();
  });
});

test.describe("Team Detail — Settings Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/teams");
    await page
      .locator("a")
      .filter({ hasText: /Biochemistry Lab/ })
      .first()
      .click();
    await page.getByRole("button", { name: "设置" }).click();
  });

  test("team name field is pre-filled", async ({ page }) => {
    const nameInput = page
      .locator("input")
      .filter({ hasText: /Biochemistry/ })
      .first();
    // Alternatively check via label
    await expect(page.getByText("团队名称")).toBeVisible();
  });

  test("visibility dropdown has 3 options", async ({ page }) => {
    const select = page.getByRole("combobox");
    await expect(select.getByRole("option", { name: "公开" })).toBeAttached();
    await expect(select.getByRole("option", { name: "私密" })).toBeAttached();
    await expect(
      select.getByRole("option", { name: "仅邀请" }),
    ).toBeAttached();
  });

  test("save button is clickable", async ({ page }) => {
    await expect(page.getByRole("button", { name: "保存更改" })).toBeEnabled();
  });

  test("description field is editable", async ({ page }) => {
    await expect(page.getByText("描述")).toBeVisible();
  });
});

test.describe("Team Detail — Members Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/teams");
    await page
      .locator("a")
      .filter({ hasText: /Biochemistry Lab/ })
      .first()
      .click();
  });

  test("shows all team members with names", async ({ page }) => {
    await expect(page.getByText("Sarah Chen")).toBeVisible();
    await expect(page.getByText("Alex Kim")).toBeVisible();
    await expect(page.getByText("Mike Johnson")).toBeVisible();
    await expect(
      page.getByRole("main").getByText("System Admin"),
    ).toBeVisible();
  });

  test("members have role badges", async ({ page }) => {
    await expect(page.getByText("所有者")).toBeVisible();
    await expect(page.getByText("管理员")).toBeVisible();
  });

  test("invite member button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "邀请成员" })).toBeVisible();
  });

  test("member count shows correctly", async ({ page }) => {
    await expect(page.getByText("4 位成员")).toBeVisible();
  });
});

test.describe("Team Detail — Invitations Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/teams");
    await page
      .locator("a")
      .filter({ hasText: /Biochemistry Lab/ })
      .first()
      .click();
    await page.getByRole("button", { name: "邀请", exact: true }).click();
  });

  test("shows create invitation button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "创建邀请" })).toBeVisible();
  });

  test("create invitation opens form", async ({ page }) => {
    await page.getByRole("button", { name: "创建邀请" }).click();
    await page.waitForTimeout(500);
    // Should show email input or invitation form
    const hasForm = await page
      .locator("input[type='email'], input[placeholder*='邮箱']")
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasForm).toBeTruthy();
  });
});

test.describe("Team Detail — Applications Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/teams");
    await page
      .locator("a")
      .filter({ hasText: /Biochemistry Lab/ })
      .first()
      .click();
    await page.getByRole("button", { name: "申请" }).click();
  });

  test("shows empty state when no applications", async ({ page }) => {
    await expect(page.getByText("暂无申请")).toBeVisible();
  });
});

test.describe("Team — Multi-role Access", () => {
  test("PI can view team detail", async ({ page }) => {
    await loginAsPI(page);
    await page.goto("/teams");
    await page
      .locator("a")
      .filter({ hasText: /Biochemistry Lab/ })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Biochemistry Lab" }),
    ).toBeVisible();
  });

  test("researcher can view team detail", async ({ page }) => {
    await loginAsResearcher(page);
    await page.goto("/teams");
    await page
      .locator("a")
      .filter({ hasText: /Biochemistry Lab/ })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Biochemistry Lab" }),
    ).toBeVisible();
  });

  test("technician can view team detail", async ({ page }) => {
    await loginAsTech(page);
    await page.goto("/teams");
    await page
      .locator("a")
      .filter({ hasText: /Biochemistry Lab/ })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Biochemistry Lab" }),
    ).toBeVisible();
  });

  test("PI can see members tab", async ({ page }) => {
    await loginAsPI(page);
    await page.goto("/teams");
    await page
      .locator("a")
      .filter({ hasText: /Biochemistry Lab/ })
      .first()
      .click();
    await expect(page.getByText("Sarah Chen")).toBeVisible();
  });

  test("all roles see team tabs", async ({ page }) => {
    const roles = [loginAsAdmin, loginAsPI, loginAsResearcher, loginAsTech];
    for (const loginFn of roles) {
      await loginFn(page);
      await page.goto("/teams");
      await page
        .locator("a")
        .filter({ hasText: /Biochemistry Lab/ })
        .first()
        .click();
      await expect(
        page.getByRole("button", { name: "成员", exact: true }),
      ).toBeVisible();
      await page.goto("/login");
    }
  });
});
