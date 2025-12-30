import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt"
import { Cpu, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  endDeviceClient,
  type EndDevice,
} from "@/lib/api"

export function DeviceList() {
  const { orgId, workspaceId } = useParams<{ orgId: string; workspaceId: string }>()
  const [devices, setDevices] = useState<EndDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create modal state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: "",
    definitionId: "",
  })

  const fetchDevices = async () => {
    if (!orgId || !workspaceId) return
    try {
      setLoading(true)
      setError(null)
      const response = await endDeviceClient.getWorkspaceEndDevices({
        organizationId: orgId,
        workspaceId,
      })
      setDevices(response.endDevices)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [orgId, workspaceId])

  const handleCreateDevice = async () => {
    if (!orgId || !workspaceId || !newDevice.name.trim() || !newDevice.definitionId.trim()) return

    try {
      setCreating(true)
      await endDeviceClient.createEndDevice({
        organizationId: orgId,
        workspaceId,
        name: newDevice.name,
        definitionId: newDevice.definitionId,
      })
      setNewDevice({ name: "", definitionId: "" })
      setDialogOpen(false)
      fetchDevices()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create device")
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "—"
    return timestampDate(timestamp).toLocaleString()
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="text-lg font-semibold">End Devices</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create End Device</DialogTitle>
                <DialogDescription>
                  Register a new device to this workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    placeholder="My Device"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="definitionId">Definition ID</Label>
                  <Input
                    id="definitionId"
                    value={newDevice.definitionId}
                    onChange={(e) => setNewDevice({ ...newDevice, definitionId: e.target.value })}
                    placeholder="Device definition identifier"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateDevice}
                  disabled={creating || !newDevice.name.trim() || !newDevice.definitionId.trim()}
                >
                  {creating ? "Creating..." : "Create Device"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Devices</CardDescription>
                <CardTitle className="text-3xl">{devices.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Devices</CardTitle>
              <CardDescription>
                Devices registered to this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading devices...
                </div>
              ) : error ? (
                <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                  {error}
                </div>
              ) : devices.length === 0 ? (
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
