import { test as base, type Page } from "@playwright/test"
import { mockGrpc } from "./grpc"
import { responses, services } from "../mocks/handlers"

/**
 * Fixture that provides a page with authentication pre-mocked.
 * Refresh and GetUser are intercepted before any navigation so the
 * AuthProvider's mount-time refresh succeeds and the app considers
 * the user authenticated.
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Mock the auth endpoints that fire on mount
    await mockGrpc(page, services.refresh, responses.refresh())
    await mockGrpc(page, services.getUser, responses.getUser())
    await mockGrpc(page, services.logout, responses.logout())

    // Pre-mock organizations so authenticated routes that load orgs don't fail
    await mockGrpc(
      page,
      services.userOrganizations,
      responses.userOrganizations(),
    )

    await use(page)
  },
})

export { expect } from "@playwright/test"
