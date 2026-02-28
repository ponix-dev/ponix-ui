import { test, expect } from "@playwright/test"
import { mockGrpc } from "../fixtures/grpc"
import { services } from "../mocks/handlers"

test.describe("smoke tests", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    // Mock refresh to fail (unauthenticated)
    await mockGrpc(
      page,
      services.refresh,
      { code: "unauthenticated", message: "no session" },
      401,
    )

    await page.goto("/organizations")
    await expect(page).toHaveURL(/\/login/)
  })

  test("login page renders with email and password inputs", async ({
    page,
  }) => {
    // Mock refresh to fail so we stay on login
    await mockGrpc(
      page,
      services.refresh,
      { code: "unauthenticated", message: "no session" },
      401,
    )

    await page.goto("/login")

    await expect(page.getByText("Welcome back")).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible()
  })
})
