import { test, expect } from "../fixtures/auth"
import { mockGrpc } from "../fixtures/grpc"
import {
  services,
  responses,
  TEST_ORG,
  TEST_GATEWAY,
  TEST_WORKSPACE,
  TEST_DEFINITION,
} from "../mocks/handlers"

test.describe("navigation", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockGrpc(
      page,
      services.getOrganization,
      responses.getOrganization(),
    )
  })

  test("org switcher shows organizations", async ({
    authenticatedPage: page,
  }) => {
    await mockGrpc(
      page,
      services.listWorkspaces,
      responses.listWorkspaces([]),
    )

    await page.goto(`/organizations/${TEST_ORG.id}/workspaces`)

    // Click org switcher button (shows org name)
    await page.getByRole("button", { name: TEST_ORG.name }).click()

    // Should show org list in dropdown
    await expect(
      page.getByRole("menuitem", { name: TEST_ORG.name }),
    ).toBeVisible()
    await expect(
      page.getByRole("menuitem", { name: "All Organizations" }),
    ).toBeVisible()
  })

  test("sidebar shows org-level nav items", async ({
    authenticatedPage: page,
  }) => {
    await mockGrpc(
      page,
      services.listWorkspaces,
      responses.listWorkspaces([]),
    )

    await page.goto(`/organizations/${TEST_ORG.id}/workspaces`)

    // Check sidebar nav links exist
    await expect(
      page.getByRole("link", { name: "Workspaces" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Gateways" })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Definitions" }),
    ).toBeVisible()
  })

  test("sidebar changes for gateway detail", async ({
    authenticatedPage: page,
  }) => {
    await mockGrpc(page, services.getGateway, responses.getGateway())

    await page.goto(
      `/organizations/${TEST_ORG.id}/gateways/${TEST_GATEWAY.gatewayId}/overview`,
    )

    // Back breadcrumb link to gateways list
    const backLink = page.getByRole("link", { name: "Gateways" })
    await expect(backLink).toBeVisible()

    // Gateway name in sidebar header
    await expect(page.getByText(TEST_GATEWAY.name).first()).toBeVisible()

    // Nav items: Overview and Data Streams links
    await expect(
      page.getByRole("link", { name: "Overview" }),
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Data Streams" }),
    ).toBeVisible()
  })

  test("sidebar changes for workspace detail", async ({
    authenticatedPage: page,
  }) => {
    await mockGrpc(page, services.getWorkspace, responses.getWorkspace())
    await mockGrpc(
      page,
      services.getWorkspaceDataStreams,
      responses.listWorkspaceDataStreams([]),
    )
    await mockGrpc(
      page,
      services.listDefinitions,
      responses.listDefinitions(),
    )
    await mockGrpc(page, services.listGateways, responses.listGateways())

    await page.goto(
      `/organizations/${TEST_ORG.id}/workspaces/${TEST_WORKSPACE.id}/data-streams`,
    )

    // Back breadcrumb link
    const backLink = page.getByRole("link", { name: "Workspaces" })
    await expect(backLink).toBeVisible()

    // Workspace name in sidebar
    await expect(page.getByText(TEST_WORKSPACE.name).first()).toBeVisible()

    // Data Streams nav link
    await expect(
      page.getByRole("link", { name: "Data Streams" }),
    ).toBeVisible()
  })

  test("sidebar changes for definition detail", async ({
    authenticatedPage: page,
  }) => {
    await mockGrpc(
      page,
      services.getDefinition,
      responses.getDefinition(),
    )

    await page.goto(
      `/organizations/${TEST_ORG.id}/definitions/${TEST_DEFINITION.id}/overview`,
    )

    // Back breadcrumb link
    const backLink = page.getByRole("link", { name: "Definitions" })
    await expect(backLink).toBeVisible()

    // Definition name in sidebar
    await expect(
      page.getByText(TEST_DEFINITION.name).first(),
    ).toBeVisible()

    // Overview nav link
    await expect(
      page.getByRole("link", { name: "Overview" }),
    ).toBeVisible()
  })
})
