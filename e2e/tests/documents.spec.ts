import { test, expect } from "../fixtures/auth"
import { mockGrpc, interceptGrpc } from "../fixtures/grpc"
import {
  services,
  responses,
  TEST_ORG,
  TEST_WORKSPACE,
  TEST_DEFINITION,
  TEST_DATA_STREAM,
  TEST_DOCUMENT,
} from "../mocks/handlers"

test.describe("workspace documents", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.getOrganization, responses.getOrganization())
    await mockGrpc(page, services.getWorkspace, responses.getWorkspace())
  })

  test("lists documents", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listWorkspaceDocuments, responses.listWorkspaceDocuments())

    await page.goto(
      `/organizations/${TEST_ORG.id}/workspaces/${TEST_WORKSPACE.id}/documents`,
    )

    await expect(page.getByText(TEST_DOCUMENT.name)).toBeVisible()
  })

  test("empty state shows message", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listWorkspaceDocuments, responses.listWorkspaceDocuments([]))

    await page.goto(
      `/organizations/${TEST_ORG.id}/workspaces/${TEST_WORKSPACE.id}/documents`,
    )

    await expect(page.getByText("No documents yet")).toBeVisible()
  })

  test("create document and navigate to editor", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listWorkspaceDocuments, responses.listWorkspaceDocuments([]))
    await mockGrpc(page, services.getDocument, responses.getDocument())

    let createCalled = false
    await interceptGrpc(page, services.createWorkspaceDocument, async (body) => {
      createCalled = true
      expect(body.name).toBe("My New Doc")
      expect(body.workspaceId).toBe(TEST_WORKSPACE.id)
      return responses.createWorkspaceDocument()
    })

    await page.goto(
      `/organizations/${TEST_ORG.id}/workspaces/${TEST_WORKSPACE.id}/documents`,
    )

    await page.getByRole("button", { name: "New Document" }).click()
    await page.getByLabel("Name").fill("My New Doc")

    // Re-mock list to include the new doc after creation
    await mockGrpc(page, services.listWorkspaceDocuments, responses.listWorkspaceDocuments())

    await page.getByRole("button", { name: "Create" }).click()

    // Should navigate to document detail
    await expect(page).toHaveURL(/\/documents\/doc-1/, { timeout: 10000 })
    expect(createCalled).toBe(true)
  })
})

test.describe("definition documents", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.getOrganization, responses.getOrganization())
    await mockGrpc(page, services.getDefinition, responses.getDefinition())
  })

  test("lists documents", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listDefinitionDocuments, responses.listDefinitionDocuments())

    await page.goto(
      `/organizations/${TEST_ORG.id}/definitions/${TEST_DEFINITION.id}/documents`,
    )

    await expect(page.getByText(TEST_DOCUMENT.name)).toBeVisible()
  })

  test("empty state shows message", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listDefinitionDocuments, responses.listDefinitionDocuments([]))

    await page.goto(
      `/organizations/${TEST_ORG.id}/definitions/${TEST_DEFINITION.id}/documents`,
    )

    await expect(page.getByText("No documents yet")).toBeVisible()
  })
})

test.describe("data stream documents", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.getOrganization, responses.getOrganization())
    await mockGrpc(page, services.getDataStream, responses.getDataStream())
  })

  test("lists documents", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listDataStreamDocuments, responses.listDataStreamDocuments())

    await page.goto(
      `/organizations/${TEST_ORG.id}/data-streams/${TEST_DATA_STREAM.dataStreamId}/documents?workspaceId=${TEST_WORKSPACE.id}`,
    )

    await expect(page.getByText(TEST_DOCUMENT.name)).toBeVisible()
  })

  test("empty state shows message", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listDataStreamDocuments, responses.listDataStreamDocuments([]))

    await page.goto(
      `/organizations/${TEST_ORG.id}/data-streams/${TEST_DATA_STREAM.dataStreamId}/documents?workspaceId=${TEST_WORKSPACE.id}`,
    )

    await expect(page.getByText("No documents yet")).toBeVisible()
  })
})

test.describe("data stream navigation from workspace", () => {
  test("clicking data stream navigates to its documents page", async ({
    authenticatedPage: page,
  }) => {
    await mockGrpc(page, services.getOrganization, responses.getOrganization())
    await mockGrpc(page, services.getWorkspace, responses.getWorkspace())
    await mockGrpc(page, services.getWorkspaceDataStreams, responses.listWorkspaceDataStreams())
    await mockGrpc(page, services.listDefinitions, responses.listDefinitions())
    await mockGrpc(page, services.listGateways, responses.listGateways())
    // Pre-mock for the target page
    await mockGrpc(page, services.getDataStream, responses.getDataStream())
    await mockGrpc(page, services.listDataStreamDocuments, responses.listDataStreamDocuments())

    await page.goto(
      `/organizations/${TEST_ORG.id}/workspaces/${TEST_WORKSPACE.id}/data-streams`,
    )

    await page.getByText(TEST_DATA_STREAM.name).click()

    await expect(page).toHaveURL(/\/data-streams\/ds-1\/documents/, { timeout: 10000 })
  })
})
