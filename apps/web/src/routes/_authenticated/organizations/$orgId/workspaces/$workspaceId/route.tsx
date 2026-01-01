import { createFileRoute, redirect, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/workspaces/$workspaceId")({
  beforeLoad: ({ params, location }) => {
    // If navigating directly to /workspaces/$workspaceId, redirect to end-devices
    if (location.pathname === `/organizations/${params.orgId}/workspaces/${params.workspaceId}`) {
      throw redirect({
        to: "/organizations/$orgId/workspaces/$workspaceId/end-devices",
        params: { orgId: params.orgId, workspaceId: params.workspaceId },
      })
    }
  },
  component: () => <Outlet />,
})
