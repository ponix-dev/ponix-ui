import { createFileRoute, redirect, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/gateways/$gatewayId")({
  beforeLoad: ({ params, location }) => {
    // If navigating directly to /gateways/$gatewayId, redirect to overview
    if (location.pathname === `/organizations/${params.orgId}/gateways/${params.gatewayId}`) {
      throw redirect({
        to: "/organizations/$orgId/gateways/$gatewayId/overview",
        params: { orgId: params.orgId, gatewayId: params.gatewayId },
      })
    }
  },
  component: () => <Outlet />,
})
