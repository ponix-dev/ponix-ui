import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { userClient, setTokenGetter } from "@/lib/api"
import type { AuthContextValue, AuthUser } from "./types"

const AuthContext = createContext<AuthContextValue | null>(null)

// JWT decode helper (no validation, just extract payload)
function decodeJwtPayload(token: string): { sub: string; email: string; exp: number } | null {
  try {
    const payload = token.split(".")[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Use ref to avoid stale closure in token getter
  const accessTokenRef = useRef<string | null>(null)
  accessTokenRef.current = accessToken

  // Register token getter with transport on mount
  useEffect(() => {
    setTokenGetter(() => accessTokenRef.current)
  }, [])

  const isAuthenticated = !!user && !!accessToken

  // Refresh auth token (called on mount and before expiration)
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await userClient.refresh({})
      const token = response.accessToken
      setAccessToken(token)
      // Update ref immediately so subsequent API calls have the token
      accessTokenRef.current = token

      // Extract user info from token
      const payload = decodeJwtPayload(token)
      if (payload) {
        // Fetch full user details
        const userResponse = await userClient.getUser({ userId: payload.sub })
        if (userResponse.user) {
          setUser({
            id: userResponse.user.id,
            email: userResponse.user.email,
            name: userResponse.user.name,
          })
        }
      }
      return true
    } catch {
      setUser(null)
      setAccessToken(null)
      return false
    }
  }, [])

  // Login
  const login = useCallback(async (email: string, password: string) => {
    const response = await userClient.login({ email, password })
    const token = response.token
    setAccessToken(token)
    // Update ref immediately so subsequent API calls have the token
    accessTokenRef.current = token

    // Extract user info from token and fetch user details
    const payload = decodeJwtPayload(token)
    if (payload) {
      const userResponse = await userClient.getUser({ userId: payload.sub })
      if (userResponse.user) {
        setUser({
          id: userResponse.user.id,
          email: userResponse.user.email,
          name: userResponse.user.name,
        })
      }
    }
  }, [])

  // Register
  const register = useCallback(async (email: string, password: string, name: string) => {
    await userClient.registerUser({ email, password, name })
    // After registration, log the user in
    await login(email, password)
  }, [login])

  // Logout
  const logout = useCallback(async () => {
    try {
      await userClient.logout({})
    } finally {
      setUser(null)
      setAccessToken(null)
    }
  }, [])

  // Try to refresh on mount (checks for existing session via refresh cookie)
  useEffect(() => {
    refreshAuth().finally(() => setIsLoading(false))
  }, [refreshAuth])

  // Set up token refresh before expiration
  useEffect(() => {
    if (!accessToken) return

    const payload = decodeJwtPayload(accessToken)
    if (!payload) return

    // Refresh 1 minute before expiration
    const expiresAt = payload.exp * 1000
    const refreshAt = expiresAt - 60_000
    const delay = refreshAt - Date.now()

    if (delay <= 0) {
      refreshAuth()
      return
    }

    const timer = setTimeout(() => {
      refreshAuth()
    }, delay)

    return () => clearTimeout(timer)
  }, [accessToken, refreshAuth])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
