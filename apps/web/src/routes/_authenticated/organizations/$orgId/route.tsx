import { createFileRoute, redirect, Outlet } from "@tanstack/react-router"
import { AppSidebar } from "@/components/layout"

export const Route = createFileRoute("/_authenticated/organizations/$orgId")({
  beforeLoad: ({ params, location }) => {
    // If navigating directly to /organizations/$orgId, redirect to workspaces
    if (location.pathname === `/organizations/${params.orgId}`) {
      throw redirect({
        to: "/organizations/$orgId/workspaces",
        params: { orgId: params.orgId },
      })
    }
  },
  component: OrgLayout,
})

function OrgLayout() {
  return (
    <div className="flex flex-1">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
