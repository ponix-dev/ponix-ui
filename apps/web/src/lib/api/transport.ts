import { createGrpcWebTransport } from "@connectrpc/connect-web"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50051"

// Token getter - will be set by AuthContext
let getAccessToken: (() => string | null) | null = null

export function setTokenGetter(getter: () => string | null) {
  getAccessToken = getter
}

export const transport = createGrpcWebTransport({
  baseUrl: API_URL,
  // Custom fetch to include credentials and auth header
  fetch: (input, init) => {
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
  },
})
