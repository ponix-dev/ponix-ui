import type { Page } from "@playwright/test"

/**
 * Mock a ConnectRPC unary call with a static JSON response.
 *
 * Service paths follow the ConnectRPC format: `{package}.{ServiceName}/{MethodName}`
 * e.g. `user.v1.UserService/Login`
 */
export async function mockGrpc(
  page: Page,
  servicePath: string,
  responseBody: object,
  status = 200,
) {
  await page.route(`**/${servicePath}`, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    }),
  )
}

/**
 * Intercept a ConnectRPC call with a custom handler for request inspection.
 */
export async function interceptGrpc(
  page: Page,
  servicePath: string,
  handler: (body: any) => object | Promise<object>,
) {
  await page.route(`**/${servicePath}`, async (route) => {
    const request = route.request()
    const body = request.postDataJSON()
    const responseBody = await handler(body)
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    })
  })
}

/**
 * Batch-setup multiple ConnectRPC mocks from a record of service paths to response bodies.
 */
export async function mockGrpcAll(
  page: Page,
  mocks: Record<string, object>,
) {
  await Promise.all(
    Object.entries(mocks).map(([path, body]) => mockGrpc(page, path, body)),
  )
}
