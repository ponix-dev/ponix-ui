import { test, expect } from "../fixtures/auth"
import { mockGrpc, interceptGrpc } from "../fixtures/grpc"
import { responses, services, TEST_ORG } from "../mocks/handlers"

test.describe("organizations", () => {
  test("lists existing organizations", async ({ authenticatedPage: page }) => {
    await page.goto("/organizations")

    await expect(page.getByText("Your Organizations")).toBeVisible()
    await expect(page.getByText(TEST_ORG.name)).toBeVisible()
  })

  test("create organization appears after creation", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/organizations")
    await expect(page.getByText(TEST_ORG.name)).toBeVisible()

    // Mock create organization
    await mockGrpc(
      page,
      services.createOrganization,
      responses.createOrganization("org-new"),
    )

    // Fill in org name and create
    await page.getByPlaceholder("Organization name").fill("New Org")
    await page.getByRole("button", { name: "Create" }).click()

    // After creation, the app navigates to the new org — verify navigation happened
    await expect(page).toHaveURL(/\/organizations\/org-new/, { timeout: 10000 })
  })

  test("empty state shows message when no organizations", async ({
    authenticatedPage: page,
  }) => {
    // Override the default mock to return empty list
    await mockGrpc(
      page,
      services.userOrganizations,
      responses.userOrganizations([]),
    )

    await page.goto("/organizations")

    await expect(
      page.getByText("No organizations yet. Create one to get started."),
    ).toBeVisible()
  })
})
