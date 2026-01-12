import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@connectrpc/connect-query"
import { Radio, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getGateway } from "@buf/ponix_ponix.connectrpc_query-es/gateway/v1/gateway-GatewayService_connectquery"
import { GatewayType } from "@/lib/api"
import { gatewayQueryOptions } from "@/lib/queries"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/gateways/$gatewayId/overview")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      gatewayQueryOptions(context.transport, params.orgId, params.gatewayId)
    )
  },
  component: GatewayDetail,
})

function GatewayDetail() {
  const { orgId, gatewayId } = Route.useParams()

  const { data: gatewayResponse } = useSuspenseQuery(getGateway, { organizationId: orgId, gatewayId })
  const gateway = gatewayResponse?.gateway ?? null

  const typeLabel = (type: GatewayType) => {
    switch (type) {
      case GatewayType.EMQX:
        return "EMQX"
      default:
        return "Unknown"
    }
  }

  const formatDate = (timestamp: { seconds: bigint } | undefined) => {
    if (!timestamp) return "N/A"
    return new Date(Number(timestamp.seconds) * 1000).toLocaleString()
  }

  if (!gateway) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Gateway not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center gap-4 px-6">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{gateway.name}</h1>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">Overview</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Gateway ID</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-xs text-muted-foreground">{gateway.gatewayId}</code>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Type</CardDescription>
                <CardTitle className="text-sm">{typeLabel(gateway.type)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{formatDate(gateway.createdAt)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
              <CardDescription>
                Gateway connection settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gateway.config.case === "emqxConfig" ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Broker URL</div>
                    <code className="mt-1 block text-sm text-muted-foreground">
                      {gateway.config.value.brokerUrl}
                    </code>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  No configuration available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
