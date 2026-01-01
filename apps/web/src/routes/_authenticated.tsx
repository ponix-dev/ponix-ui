import { useEffect } from "react"
import { createFileRoute, redirect, Outlet, useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth"
import { AppHeader } from "@/components/layout"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    // Redirect to login if not authenticated (handles initial navigation)
    if (!context.auth.isLoading && !context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Handle logout - redirect to login when auth state changes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" })
    }
  }, [isLoading, isAuthenticated, navigate])

  // Show loading while auth is being determined
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Show nothing briefly while redirecting after logout
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
