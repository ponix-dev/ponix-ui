/**
 * Mock JWT token with a far-future expiration to prevent refresh timers during tests.
 * Payload: { sub: "user-1", email: "test@example.com", exp: 9999999999 }
 */
function makeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = btoa(JSON.stringify(payload))
  const signature = btoa("mock-signature")
  return `${header}.${body}.${signature}`
}

export const TEST_USER = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
}

export const TEST_TOKEN = makeJwt({
  sub: TEST_USER.id,
  email: TEST_USER.email,
  exp: 9999999999,
})

export const TEST_ORG = {
  id: "org-1",
  name: "Test Org",
}

// ── Response factories ──

export const responses = {
  login: () => ({ token: TEST_TOKEN }),
  refresh: () => ({ accessToken: TEST_TOKEN }),
  getUser: () => ({ user: TEST_USER }),
  logout: () => ({}),
  userOrganizations: (orgs = [TEST_ORG]) => ({ organizations: orgs }),
  createOrganization: (id = "org-new", name = "New Org") => ({
    organizationId: id,
  }),
}

// ── Service paths ──

export const services = {
  login: "user.v1.UserService/Login",
  refresh: "user.v1.UserService/Refresh",
  getUser: "user.v1.UserService/GetUser",
  logout: "user.v1.UserService/Logout",
  userOrganizations: "organization.v1.OrganizationService/UserOrganizations",
  createOrganization: "organization.v1.OrganizationService/CreateOrganization",
} as const

// ── ConnectRPC error helpers ──

export function connectError(code: string, message: string) {
  return { code, message }
}
