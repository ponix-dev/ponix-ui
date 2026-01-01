import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@connectrpc/connect-query"
import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt"
import { Radio, ChevronRight, Cpu } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getGateway } from "@buf/ponix_ponix.connectrpc_query-es/gateway/v1/gateway-GatewayService_connectquery"
import { getGatewayEndDevices } from "@buf/ponix_ponix.connectrpc_query-es/end_device/v1/end_device-EndDeviceService_connectquery"
import { gatewayQueryOptions, gatewayDevicesQueryOptions } from "@/lib/queries"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/gateways/$gatewayId/end-devices")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        gatewayQueryOptions(context.transport, params.orgId, params.gatewayId)
      ),
      context.queryClient.ensureQueryData(
        gatewayDevicesQueryOptions(context.transport, params.orgId, params.gatewayId)
      ),
    ])
  },
  component: GatewayEndDevices,
})

function GatewayEndDevices() {
  const { orgId, gatewayId } = Route.useParams()

  const { data: gatewayResponse } = useSuspenseQuery(getGateway, { organizationId: orgId, gatewayId })
  const gateway = gatewayResponse?.gateway ?? null

  const { data: devicesResponse } = useSuspenseQuery(getGatewayEndDevices, { organizationId: orgId, gatewayId })
  const devices = devicesResponse?.endDevices ?? []

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
            <span className="text-lg text-muted-foreground">End Devices</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connected Devices</CardTitle>
              <CardDescription>
                End devices connected through this gateway
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No devices connected to this gateway
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div
                      key={device.deviceId}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Cpu className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {device.deviceId}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {formatDate(device.createdAt)}
                      </div>
                    </div>
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
