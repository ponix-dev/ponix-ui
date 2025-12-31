import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Radio, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  gatewayClient,
  type Gateway,
  GatewayType,
} from "@/lib/api"

export function GatewayDetail() {
  const { orgId, gatewayId } = useParams<{ orgId: string; gatewayId: string }>()
  const [gateway, setGateway] = useState<Gateway | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGateway = async () => {
      if (!orgId || !gatewayId) return
      try {
        setLoading(true)
        setError(null)
        const response = await gatewayClient.getGateway({
          organizationId: orgId,
          gatewayId,
        })
        setGateway(response.gateway ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch gateway")
      } finally {
        setLoading(false)
      }
    }

    fetchGateway()
  }, [orgId, gatewayId])

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

  if (!gateway) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Gateway not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
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

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Info Cards */}
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

          {/* Configuration */}
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
                  {gateway.config.value.subscriptionGroup && (
                    <div>
                      <div className="text-sm font-medium">Subscription Group</div>
                      <code className="mt-1 block text-sm text-muted-foreground">
                        {gateway.config.value.subscriptionGroup}
                      </code>
                    </div>
                  )}
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
