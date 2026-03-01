import { test, expect } from "../fixtures/auth"
import { mockGrpc } from "../fixtures/grpc"
import {
  services,
  responses,
  TEST_ORG,
  TEST_WORKSPACE,
} from "../mocks/handlers"

test.describe("workspaces", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockGrpc(
      page,
      services.getOrganization,
      responses.getOrganization(),
    )
  })

  test("empty state shows message", async ({ authenticatedPage: page }) => {
    await mockGrpc(
      page,
      services.listWorkspaces,
      responses.listWorkspaces([]),
    )

    await page.goto(`/organizations/${TEST_ORG.id}/workspaces`)

    await expect(page.getByText("No workspaces created yet")).toBeVisible()
  })

  test("lists workspaces", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listWorkspaces, responses.listWorkspaces())

    await page.goto(`/organizations/${TEST_ORG.id}/workspaces`)

    await expect(page.getByText(TEST_WORKSPACE.name)).toBeVisible()
    await expect(page.getByText(TEST_WORKSPACE.id)).toBeVisible()
  })

  test("create workspace", async ({ authenticatedPage: page }) => {
    await mockGrpc(
      page,
      services.listWorkspaces,
      responses.listWorkspaces([]),
    )
    await mockGrpc(
      page,
      services.createWorkspace,
      responses.createWorkspace(),
    )

    await page.goto(`/organizations/${TEST_ORG.id}/workspaces`)

    await page.getByRole("button", { name: "Add Workspace" }).click()

    await expect(
      page.getByRole("heading", { name: "Create Workspace" }),
    ).toBeVisible()
    await page.getByLabel("Name").fill("My Workspace")

    // After creating, re-mock the list to include the new workspace
    await mockGrpc(
      page,
      services.listWorkspaces,
      responses.listWorkspaces(),
    )

    await page.getByRole("button", { name: "Create Workspace" }).click()

    // Dialog should close
    await expect(
      page.getByRole("button", { name: "Add Workspace" }),
    ).toBeVisible()
  })
})
