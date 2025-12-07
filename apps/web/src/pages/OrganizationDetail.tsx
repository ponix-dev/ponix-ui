import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt"
import { Radio, Cpu } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  organizationClient,
  gatewayClient,
  endDeviceClient,
  type Organization,
  type Gateway,
  type EndDevice,
  OrganizationStatus,
  GatewayStatus,
  GatewayType,
} from "@/lib/api"

export function OrganizationDetail() {
  const { orgId } = useParams<{ orgId: string }>()

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [devices, setDevices] = useState<EndDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [orgResponse, gatewaysResponse, devicesResponse] = await Promise.all([
          organizationClient.getOrganization({ organizationId: orgId }),
          gatewayClient.listGateways({ organizationId: orgId }),
          endDeviceClient.listEndDevices({ organizationId: orgId }),
        ])

        setOrganization(orgResponse.organization ?? null)
        setGateways(gatewaysResponse.gateways)
        setDevices(devicesResponse.endDevices)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [orgId])

  const orgStatusLabel = (status: OrganizationStatus) => {
    switch (status) {
      case OrganizationStatus.ACTIVE:
        return "Active"
      case OrganizationStatus.PENDING:
        return "Pending"
      case OrganizationStatus.INACTIVE:
        return "Inactive"
      default:
        return "Unknown"
    }
  }

  const orgStatusVariant = (status: OrganizationStatus) => {
    switch (status) {
      case OrganizationStatus.ACTIVE:
        return "default"
      case OrganizationStatus.PENDING:
        return "secondary"
      default:
        return "outline"
    }
  }

  const gatewayStatusLabel = (status: GatewayStatus) => {
    switch (status) {
      case GatewayStatus.ACTIVE:
        return "Active"
      case GatewayStatus.PENDING:
        return "Pending"
      case GatewayStatus.ERROR:
        return "Error"
      default:
        return "Unknown"
    }
  }

  const gatewayStatusVariant = (status: GatewayStatus) => {
    switch (status) {
      case GatewayStatus.ACTIVE:
        return "default"
      case GatewayStatus.PENDING:
        return "secondary"
      case GatewayStatus.ERROR:
        return "destructive"
      default:
        return "outline"
    }
  }

  const gatewayTypeLabel = (type: GatewayType) => {
    switch (type) {
      case GatewayType.EMQX:
        return "EMQX"
      default:
        return "Unknown"
    }
  }

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "—"
    return timestampDate(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Organization not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-14 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{organization.name}</h1>
            <Badge variant={orgStatusVariant(organization.status)}>
              {orgStatusLabel(organization.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Organization ID</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-xs text-muted-foreground">{organization.id}</code>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Gateways</CardDescription>
                <CardTitle className="text-3xl">{gateways.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>End Devices</CardDescription>
                <CardTitle className="text-3xl">{devices.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{formatDate(organization.createdAt)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Gateways and Devices */}
          <Tabs defaultValue="gateways" className="w-full">
            <TabsList>
              <TabsTrigger value="gateways" className="gap-2">
                <Radio className="h-4 w-4" />
                Gateways ({gateways.length})
              </TabsTrigger>
              <TabsTrigger value="devices" className="gap-2">
                <Cpu className="h-4 w-4" />
                End Devices ({devices.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gateways" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gateways</CardTitle>
                  <CardDescription>
                    IoT gateways connected to this organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {gateways.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No gateways configured
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {gateways.map((gateway) => (
                        <div
                          key={gateway.gatewayId}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Radio className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{gateway.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {gateway.gatewayId}
                              </div>
                              {gateway.config.case === "emqxConfig" && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {gateway.config.value.brokerUrl}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{gatewayTypeLabel(gateway.type)}</Badge>
                            <Badge variant={gatewayStatusVariant(gateway.status)}>
                              {gatewayStatusLabel(gateway.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="devices" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">End Devices</CardTitle>
                  <CardDescription>
                    Devices registered to this organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {devices.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No devices registered
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
                              {device.payloadConversion && (
                                <code className="mt-1 block text-xs text-muted-foreground">
                                  {device.payloadConversion}
                                </code>
                              )}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
