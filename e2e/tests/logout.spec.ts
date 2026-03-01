import { test, expect } from "../fixtures/auth"
import { mockGrpc } from "../fixtures/grpc"
import { services, connectError } from "../mocks/handlers"

test.describe("logout", () => {
  test("logout redirects to login", async ({ authenticatedPage: page }) => {
    await page.goto("/organizations")
    await expect(page.getByText("Your Organizations")).toBeVisible()

    // Click the avatar/user menu button (shows user initials "TU")
    await page.getByRole("button", { name: "TU" }).click()

    // Mock logout to clear auth, then refresh should fail
    await mockGrpc(
      page,
      services.refresh,
      connectError("unauthenticated", "Not authenticated"),
      401,
    )

    await page.getByText("Log out").click()

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
