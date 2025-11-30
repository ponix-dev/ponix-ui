import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Radio, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  gatewayClient,
  type Gateway,
  GatewayStatus,
  GatewayType,
} from "@/lib/api"

type GatewayTypeKey = "emqx"

interface EmqxConfig {
  brokerUrl: string
  subscriptionGroup: string
}

interface NewGatewayState {
  name: string
  type: GatewayTypeKey | ""
  emqxConfig: EmqxConfig
}

const initialGatewayState: NewGatewayState = {
  name: "",
  type: "",
  emqxConfig: { brokerUrl: "", subscriptionGroup: "" },
}

export function GatewayList() {
  const { orgId } = useParams<{ orgId: string }>()
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create modal state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newGateway, setNewGateway] = useState<NewGatewayState>(initialGatewayState)

  const fetchGateways = async () => {
    if (!orgId) return
    try {
      setLoading(true)
      setError(null)
      const response = await gatewayClient.listGateways({ organizationId: orgId })
      setGateways(response.gateways)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch gateways")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGateways()
  }, [orgId])

  const handleCreateGateway = async () => {
    if (!orgId || !newGateway.name.trim() || !newGateway.type) return

    try {
      setCreating(true)

      if (newGateway.type === "emqx") {
        if (!newGateway.emqxConfig.brokerUrl.trim()) return
        await gatewayClient.createGateway({
          organizationId: orgId,
          name: newGateway.name,
          type: GatewayType.EMQX,
          config: {
            case: "emqxConfig",
            value: {
              brokerUrl: newGateway.emqxConfig.brokerUrl,
              subscriptionGroup: newGateway.emqxConfig.subscriptionGroup || undefined,
            },
          },
        })
      }

      setNewGateway(initialGatewayState)
      setDialogOpen(false)
      fetchGateways()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create gateway")
    } finally {
      setCreating(false)
    }
  }

  const isCreateDisabled = () => {
    if (!newGateway.name.trim() || !newGateway.type) return true
    if (newGateway.type === "emqx" && !newGateway.emqxConfig.brokerUrl.trim()) return true
    return false
  }

  const statusLabel = (status: GatewayStatus) => {
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

  const statusVariant = (status: GatewayStatus) => {
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

  const typeLabel = (type: GatewayType) => {
    switch (type) {
      case GatewayType.EMQX:
        return "EMQX"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Gateways</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Gateway
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Gateway</DialogTitle>
                <DialogDescription>
                  Add a new gateway to connect your IoT devices.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newGateway.name}
                    onChange={(e) => setNewGateway({ ...newGateway, name: e.target.value })}
                    placeholder="My Gateway"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Gateway Type</Label>
                  <Select
                    value={newGateway.type}
                    onValueChange={(value: GatewayTypeKey) => setNewGateway({ ...newGateway, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a gateway type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emqx">EMQX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newGateway.type === "emqx" && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="brokerUrl">Broker URL</Label>
                      <Input
                        id="brokerUrl"
                        value={newGateway.emqxConfig.brokerUrl}
                        onChange={(e) => setNewGateway({
                          ...newGateway,
                          emqxConfig: { ...newGateway.emqxConfig, brokerUrl: e.target.value }
                        })}
                        placeholder="mqtt://broker.example.com:1883"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subscriptionGroup">Subscription Group</Label>
                      <Input
                        id="subscriptionGroup"
                        value={newGateway.emqxConfig.subscriptionGroup}
                        onChange={(e) => setNewGateway({
                          ...newGateway,
                          emqxConfig: { ...newGateway.emqxConfig, subscriptionGroup: e.target.value }
                        })}
                        placeholder="group-1"
                      />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateGateway}
                  disabled={creating || isCreateDisabled()}
                >
                  {creating ? "Creating..." : "Create Gateway"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Gateways</CardDescription>
                <CardTitle className="text-3xl">{gateways.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active</CardDescription>
                <CardTitle className="text-3xl">
                  {gateways.filter(g => g.status === GatewayStatus.ACTIVE).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending</CardDescription>
                <CardTitle className="text-3xl">
                  {gateways.filter(g => g.status === GatewayStatus.PENDING).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Gateways</CardTitle>
              <CardDescription>
                IoT gateways connected to this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading gateways...
                </div>
              ) : error ? (
                <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                  {error}
                </div>
              ) : gateways.length === 0 ? (
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
                        <Badge variant="outline">{typeLabel(gateway.type)}</Badge>
                        <Badge variant={statusVariant(gateway.status)}>
                          {statusLabel(gateway.status)}
                        </Badge>
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
