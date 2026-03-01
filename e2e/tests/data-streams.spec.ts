import { test, expect } from "../fixtures/auth"
import { mockGrpc } from "../fixtures/grpc"
import {
  services,
  responses,
  TEST_ORG,
  TEST_WORKSPACE,
  TEST_GATEWAY,
  TEST_DEFINITION,
} from "../mocks/handlers"

test.describe("data streams", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockGrpc(
      page,
      services.getOrganization,
      responses.getOrganization(),
    )
    await mockGrpc(page, services.getWorkspace, responses.getWorkspace())
  })

  test("empty state shows message", async ({ authenticatedPage: page }) => {
    await mockGrpc(
      page,
      services.getWorkspaceDataStreams,
      responses.listWorkspaceDataStreams([]),
    )
    // Loader also fetches definitions and gateways for the create form
    await mockGrpc(
      page,
      services.listDefinitions,
      responses.listDefinitions(),
    )
    await mockGrpc(page, services.listGateways, responses.listGateways())

    await page.goto(
      `/organizations/${TEST_ORG.id}/workspaces/${TEST_WORKSPACE.id}/data-streams`,
    )

    await expect(page.getByText("No data streams registered")).toBeVisible()
  })

  test("create data stream wizard", async ({ authenticatedPage: page }) => {
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
    await mockGrpc(
      page,
      services.createDataStream,
      responses.createDataStream(),
    )

    await page.goto(
      `/organizations/${TEST_ORG.id}/workspaces/${TEST_WORKSPACE.id}/data-streams`,
    )

    await page.getByRole("button", { name: "Add Data Stream" }).click()

    // Step 1: Name
    await expect(
      page.getByRole("heading", { name: "Create Data Stream" }),
    ).toBeVisible()
    await page.getByLabel("Name").fill("My Data Stream")
    await page.getByRole("button", { name: "Next" }).click()

    // Step 2: Select definition — the combobox trigger
    await expect(page.getByText("Step 2 of 3")).toBeVisible()
    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: TEST_DEFINITION.name }).click()
    await page.getByRole("button", { name: "Next" }).click()

    // Step 3: Select gateway
    await expect(page.getByText("Step 3 of 3")).toBeVisible()
    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: TEST_GATEWAY.name }).click()

    // After creating, re-mock the list
    await mockGrpc(
      page,
      services.getWorkspaceDataStreams,
      responses.listWorkspaceDataStreams(),
    )

    await page.getByRole("button", { name: "Create Data Stream" }).click()

    // Dialog should close
    await expect(
      page.getByRole("button", { name: "Add Data Stream" }),
    ).toBeVisible()
  })
})
