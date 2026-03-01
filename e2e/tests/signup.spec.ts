import { test, expect } from "@playwright/test"
import { mockGrpc } from "../fixtures/grpc"
import {
  services,
  responses,
  connectError,
} from "../mocks/handlers"

test.describe("signup", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure unauthenticated state
    await mockGrpc(
      page,
      services.refresh,
      connectError("unauthenticated", "Not authenticated"),
      401,
    )
  })

  test("renders signup form", async ({ page }) => {
    await page.goto("/signup")

    await expect(
      page.getByText("Create your account", { exact: true }),
    ).toBeVisible()
    await expect(page.getByLabel("Full Name")).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible()
    await expect(page.getByLabel("Confirm Password")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Create Account" }),
    ).toBeVisible()
  })

  test("validation: passwords do not match", async ({ page }) => {
    await page.goto("/signup")

    await page.getByLabel("Full Name").fill("Test User")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password", { exact: true }).fill("password123")
    await page.getByLabel("Confirm Password").fill("different123")
    await page.getByRole("button", { name: "Create Account" }).click()

    await expect(page.getByText("Passwords do not match")).toBeVisible()
  })

  test("validation: password too short", async ({ page }) => {
    await page.goto("/signup")

    await page.getByLabel("Full Name").fill("Test User")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password", { exact: true }).fill("short")
    await page.getByLabel("Confirm Password").fill("short")
    await page.getByRole("button", { name: "Create Account" }).click()

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible()
  })

  test("duplicate email shows error", async ({ page }) => {
    await mockGrpc(
      page,
      services.register,
      connectError("already_exists", "User already exists"),
      409,
    )

    await page.goto("/signup")

    await page.getByLabel("Full Name").fill("Test User")
    await page.getByLabel("Email").fill("existing@example.com")
    await page.getByLabel("Password", { exact: true }).fill("password123")
    await page.getByLabel("Confirm Password").fill("password123")
    await page.getByRole("button", { name: "Create Account" }).click()

    await expect(
      page.getByText("An account with this email already exists"),
    ).toBeVisible()
  })

  test("successful signup redirects to organizations", async ({ page }) => {
    await mockGrpc(page, services.register, responses.register())
    await mockGrpc(page, services.login, responses.login())
    // After login, auth refresh + getUser will be called
    await mockGrpc(page, services.refresh, responses.refresh())
    await mockGrpc(page, services.getUser, responses.getUser())
    await mockGrpc(
      page,
      services.userOrganizations,
      responses.userOrganizations(),
    )

    await page.goto("/signup")

    await page.getByLabel("Full Name").fill("Test User")
    await page.getByLabel("Email").fill("new@example.com")
    await page.getByLabel("Password", { exact: true }).fill("password123")
    await page.getByLabel("Confirm Password").fill("password123")
    await page.getByRole("button", { name: "Create Account" }).click()

    await expect(page).toHaveURL(/\/organizations/, { timeout: 10000 })
  })
})
