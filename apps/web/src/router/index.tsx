import { useEffect } from "react"
import {
  createRouter,
  createRootRouteWithContext,
  createRoute,
  redirect,
  Outlet,
  useRouter,
} from "@tanstack/react-router"
import type { AuthContextValue } from "@/lib/auth"
import { useAuth } from "@/lib/auth"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar, AppHeader } from "@/components/layout"
import { OrganizationList } from "@/pages/OrganizationList"
import { GatewayList } from "@/pages/GatewayList"
import { GatewayDetail } from "@/pages/GatewayDetail"
import { DeviceList } from "@/pages/DeviceList"
import { WorkspaceList } from "@/pages/WorkspaceList"
import { EndDeviceDefinitionList } from "@/pages/EndDeviceDefinitionList"
import { EndDeviceDefinitionDetail } from "@/pages/EndDeviceDefinitionDetail"
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"

// Router context type
interface RouterContext {
  auth: AuthContextValue
}

// Root route with theme provider
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: function RootComponent() {
    return (
      <ThemeProvider defaultTheme="system">
        <Outlet />
      </ThemeProvider>
    )
  },
})

// Login route - public
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || undefined,
  }),
})

// Signup route - public
const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || undefined,
  }),
})

// Authenticated layout route with auth guard
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_authenticated",
  beforeLoad: async ({ context, location }) => {
    // If not loading and not authenticated, redirect to login
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
  const router = useRouter()

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.navigate({ to: "/login", search: { redirect: undefined } })
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // If not authenticated, show nothing while redirect happens
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

// Index route - organization list without sidebar
const indexRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  component: OrganizationList,
})

// Organizations route - same as index
const organizationsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/organizations",
  component: OrganizationList,
})

// Sidebar layout route
const sidebarRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  id: "_sidebar",
  component: function SidebarLayout() {
    return (
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    )
  },
})

// Organization route - parent for all org-level routes
const orgRoute = createRoute({
  getParentRoute: () => sidebarRoute,
  path: "/organizations/$orgId",
  component: () => <Outlet />,
})

// Organization index - redirects to workspaces
const orgIndexRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: "/",
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/organizations/$orgId/workspaces",
      params: { orgId: params.orgId },
    })
  },
})

// Workspaces list
const orgWorkspacesRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: "/workspaces",
  component: WorkspaceList,
})

// Workspace detail - shows devices
const workspaceDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: "/workspaces/$workspaceId",
  component: DeviceList,
})

// Gateways list
const gatewaysRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: "/gateways",
  component: GatewayList,
})

// Gateway detail
const gatewayDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: "/gateways/$gatewayId",
  component: GatewayDetail,
})

// Definitions list
const definitionsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: "/definitions",
  component: EndDeviceDefinitionList,
})

// Definition detail
const definitionDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: "/definitions/$definitionId",
  component: EndDeviceDefinitionDetail,
})

// Build route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  authenticatedRoute.addChildren([
    indexRoute,
    organizationsRoute,
    sidebarRoute.addChildren([
      orgRoute.addChildren([
        orgIndexRoute,
        orgWorkspacesRoute,
        workspaceDetailRoute,
        gatewaysRoute,
        gatewayDetailRoute,
        definitionsRoute,
        definitionDetailRoute,
      ]),
    ]),
  ]),
])

// Create router instance
export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // Will be provided at runtime
  },
  defaultPreload: "intent",
})

// Type registration for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

// Export route for search params access
export { loginRoute }
