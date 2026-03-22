import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery } from "@connectrpc/connect-query"
import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt"
import { Radio, ChevronRight, Cpu } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getGateway } from "@buf/ponix_ponix.connectrpc_query-es/gateway/v1/gateway-GatewayService_connectquery"
import { getGatewayDataStreams } from "@buf/ponix_ponix.connectrpc_query-es/data_stream/v1/data_stream-DataStreamService_connectquery"
import { gatewayQueryOptions, gatewayDataStreamsQueryOptions } from "@/lib/queries"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/gateways/$gatewayId/data-streams")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        gatewayQueryOptions(context.transport, params.orgId, params.gatewayId)
      ),
      context.queryClient.ensureQueryData(
        gatewayDataStreamsQueryOptions(context.transport, params.orgId, params.gatewayId)
      ),
    ])
  },
  component: GatewayDataStreams,
})

function GatewayDataStreams() {
  const { orgId, gatewayId } = Route.useParams()

  const { data: gatewayResponse } = useSuspenseQuery(getGateway, { organizationId: orgId, gatewayId })
  const gateway = gatewayResponse?.gateway ?? null

  const { data: dataStreamsResponse } = useSuspenseQuery(getGatewayDataStreams, { organizationId: orgId, gatewayId })
  const dataStreams = dataStreamsResponse?.dataStreams ?? []

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "—"
    return timestampDate(timestamp).toLocaleString()
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
            <span className="text-lg text-muted-foreground">Data Streams</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connected Data Streams</CardTitle>
              <CardDescription>
                Data streams connected through this gateway
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataStreams.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No data streams connected to this gateway
                </div>
              ) : (
                <div className="space-y-3">
                  {dataStreams.map((dataStream) => (
                    <Link
                      key={dataStream.dataStreamId}
                      to="/organizations/$orgId/data-streams/$dataStreamId/documents"
                      params={{ orgId, dataStreamId: dataStream.dataStreamId }}
                      search={{ workspaceId: dataStream.workspaceId }}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Cpu className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{dataStream.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {dataStream.dataStreamId}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {formatDate(dataStream.createdAt)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
