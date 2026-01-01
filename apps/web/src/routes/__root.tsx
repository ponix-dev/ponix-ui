import { Suspense } from "react"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import type { Transport } from "@connectrpc/connect"
import type { QueryClient } from "@tanstack/react-query"
import type { AuthContextValue } from "@/lib/auth"
import { ThemeProvider } from "@/components/theme-provider"

export interface RouterContext {
  auth: AuthContextValue
  queryClient: QueryClient
  transport: Transport
}

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: function RootComponent() {
    return (
      <ThemeProvider defaultTheme="system">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </ThemeProvider>
    )
  },
})
