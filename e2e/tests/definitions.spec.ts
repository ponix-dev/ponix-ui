import { test, expect } from "../fixtures/auth"
import { mockGrpc } from "../fixtures/grpc"
import {
  services,
  responses,
  TEST_ORG,
  TEST_DEFINITION,
} from "../mocks/handlers"

test.describe("definitions", () => {
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
      services.listDefinitions,
      responses.listDefinitions([]),
    )

    await page.goto(`/organizations/${TEST_ORG.id}/definitions`)

    await expect(page.getByText("No definitions configured")).toBeVisible()
  })

  test("lists definitions with contract badge", async ({
    authenticatedPage: page,
  }) => {
    await mockGrpc(
      page,
      services.listDefinitions,
      responses.listDefinitions(),
    )

    await page.goto(`/organizations/${TEST_ORG.id}/definitions`)

    await expect(page.getByText(TEST_DEFINITION.name)).toBeVisible()
    await expect(page.getByText("1 contract")).toBeVisible()
  })

  test("create definition wizard", async ({ authenticatedPage: page }) => {
    await mockGrpc(
      page,
      services.listDefinitions,
      responses.listDefinitions([]),
    )
    await mockGrpc(
      page,
      services.createDefinition,
      responses.createDefinition(),
    )

    await page.goto(`/organizations/${TEST_ORG.id}/definitions`)

    await page.getByRole("button", { name: "Add Definition" }).click()

    // Step 1: General
    await expect(
      page.getByText("Create Data Stream Definition"),
    ).toBeVisible()
    await page.getByLabel("Name").fill("Temperature Sensor v1")

    await page.getByRole("button", { name: "Next" }).click()

    // Step 2: Contracts
    await expect(page.getByText("Payload Contracts")).toBeVisible()

    // After creating, re-mock the list
    await mockGrpc(
      page,
      services.listDefinitions,
      responses.listDefinitions(),
    )

    await page.getByRole("button", { name: "Create Definition" }).click()

    // Dialog should close
    await expect(
      page.getByRole("button", { name: "Add Definition" }),
    ).toBeVisible()
  })
})
