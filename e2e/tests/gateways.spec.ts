import { test, expect } from "../fixtures/auth"
import { mockGrpc } from "../fixtures/grpc"
import {
  services,
  responses,
  TEST_ORG,
  TEST_GATEWAY,
} from "../mocks/handlers"

test.describe("gateways", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockGrpc(
      page,
      services.getOrganization,
      responses.getOrganization(),
    )
  })

  test("empty state shows message", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listGateways, responses.listGateways([]))

    await page.goto(`/organizations/${TEST_ORG.id}/gateways`)

    await expect(page.getByText("No gateways configured")).toBeVisible()
  })

  test("lists gateways", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listGateways, responses.listGateways())

    await page.goto(`/organizations/${TEST_ORG.id}/gateways`)

    await expect(page.getByText(TEST_GATEWAY.name)).toBeVisible()
    await expect(page.getByText(TEST_GATEWAY.gatewayId)).toBeVisible()
    await expect(page.getByText("EMQX")).toBeVisible()
  })

  test("create gateway wizard", async ({ authenticatedPage: page }) => {
    await mockGrpc(page, services.listGateways, responses.listGateways([]))
    await mockGrpc(page, services.createGateway, responses.createGateway())

    await page.goto(`/organizations/${TEST_ORG.id}/gateways`)

    // Open create dialog
    await page.getByRole("button", { name: "Add Gateway" }).click()

    // Step 1: General
    await expect(page.getByText("Step 1 of 2")).toBeVisible()
    await page.getByLabel("Name").fill("My New Gateway")

    // Select gateway type via the Select trigger (combobox role)
    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: "EMQX" }).click()

    await page.getByRole("button", { name: "Next" }).click()

    // Step 2: Configuration
    await expect(page.getByText("Step 2 of 2")).toBeVisible()
    await page
      .getByLabel("Broker URL")
      .fill("mqtt://broker.example.com:1883")

    // After creating, re-mock the list to include the new gateway
    await mockGrpc(page, services.listGateways, responses.listGateways())

    await page.getByRole("button", { name: "Create Gateway" }).click()

    // Dialog should close and gateway should appear in list
    await expect(page.getByText(TEST_GATEWAY.name)).toBeVisible()
  })

  test("gateway overview shows details", async ({
    authenticatedPage: page,
  }) => {
    await mockGrpc(page, services.getGateway, responses.getGateway())

    await page.goto(
      `/organizations/${TEST_ORG.id}/gateways/${TEST_GATEWAY.gatewayId}/overview`,
    )

    // Header shows gateway name
    await expect(
      page.getByRole("heading", { name: TEST_GATEWAY.name }),
    ).toBeVisible()
    // Info cards
    await expect(page.getByText(TEST_GATEWAY.gatewayId)).toBeVisible()
    await expect(page.getByText("EMQX")).toBeVisible()
    // Configuration section
    await expect(
      page.getByText(TEST_GATEWAY.emqxConfig.brokerUrl),
    ).toBeVisible()
  })
})
