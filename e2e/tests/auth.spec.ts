import { test, expect } from "@playwright/test"
import { mockGrpc, interceptGrpc } from "../fixtures/grpc"
import { responses, services, connectError } from "../mocks/handlers"

test.describe("authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Start unauthenticated — refresh fails
    await mockGrpc(
      page,
      services.refresh,
      { code: "unauthenticated", message: "no session" },
      401,
    )
  })

  test("successful login redirects to /organizations", async ({ page }) => {
    // Mock login success + post-login calls
    await mockGrpc(page, services.login, responses.login())
    await mockGrpc(page, services.getUser, responses.getUser())
    await mockGrpc(
      page,
      services.userOrganizations,
      responses.userOrganizations(),
    )

    // After login, refresh should now succeed (new session)
    // Override the refresh mock for post-login
    await page.route(`**/${services.refresh}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(responses.refresh()),
      }),
    )

    await page.goto("/login")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password").fill("password123")
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/\/organizations/, { timeout: 10000 })
    await expect(page.getByText("Test Org")).toBeVisible()
  })

  test("invalid credentials shows error message", async ({ page }) => {
    // Mock login to return unauthenticated error
    await page.route(`**/${services.login}`, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify(
          connectError("unauthenticated", "[unauthenticated] invalid credentials"),
        ),
      }),
    )

    await page.goto("/login")
    await page.getByLabel("Email").fill("wrong@example.com")
    await page.getByLabel("Password").fill("wrongpassword")
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page.getByText("Invalid email or password.")).toBeVisible()
  })
})
