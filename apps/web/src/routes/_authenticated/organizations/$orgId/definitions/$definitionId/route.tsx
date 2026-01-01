import { createFileRoute, redirect, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/definitions/$definitionId")({
  beforeLoad: ({ params, location }) => {
    // If navigating directly to /definitions/$definitionId, redirect to overview
    if (location.pathname === `/organizations/${params.orgId}/definitions/${params.definitionId}`) {
      throw redirect({
        to: "/organizations/$orgId/definitions/$definitionId/overview",
        params: { orgId: params.orgId, definitionId: params.definitionId },
      })
    }
  },
  component: () => <Outlet />,
})
