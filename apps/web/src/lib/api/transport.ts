import { createGrpcWebTransport, createConnectTransport } from "@connectrpc/connect-web"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50051"

// Token getter - will be set by AuthContext
let getAccessToken: (() => string | null) | null = null

export function setTokenGetter(getter: () => string | null) {
  getAccessToken = getter
}

// Custom fetch to include credentials and auth header
const customFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers)

  // Add Bearer token if available
  const token = getAccessToken?.()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "include", // For HTTP-only refresh token cookie
  })
}

// Use JSON-based Connect transport in test mode for easy request mocking,
// otherwise use binary gRPC-Web transport
const createTransport =
  import.meta.env.VITE_TEST_MODE === "true"
    ? createConnectTransport
    : createGrpcWebTransport

export const transport = createTransport({
  baseUrl: API_URL,
  fetch: customFetch,
})
