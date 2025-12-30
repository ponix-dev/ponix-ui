import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt"
import { Cpu, Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  workspaceClient,
  endDeviceClient,
  type Workspace,
  type EndDevice,
  WorkspaceStatus,
} from "@/lib/api"

export function WorkspaceDetail() {
  const { orgId, workspaceId } = useParams<{ orgId: string; workspaceId: string }>()

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [devices, setDevices] = useState<EndDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId || !workspaceId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [workspaceResponse, devicesResponse] = await Promise.all([
          workspaceClient.getWorkspace({ workspaceId, organizationId: orgId }),
          endDeviceClient.getWorkspaceEndDevices({ organizationId: orgId, workspaceId }),
        ])

        setWorkspace(workspaceResponse.workspace ?? null)
        setDevices(devicesResponse.endDevices)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [orgId, workspaceId])

  const statusLabel = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return "Active"
      case WorkspaceStatus.DELETED:
        return "Deleted"
      default:
        return "Unknown"
    }
  }

  const statusVariant = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return "default"
      case WorkspaceStatus.DELETED:
        return "secondary"
      default:
        return "outline"
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

  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Workspace not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-14 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{workspace.name}</h1>
            <Badge variant={statusVariant(workspace.status)}>
              {statusLabel(workspace.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Workspace ID</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-xs text-muted-foreground">{workspace.id}</code>
              </CardContent>
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
                <div className="text-sm">{formatDate(workspace.createdAt)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Devices list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">End Devices</CardTitle>
              <CardDescription>
                Devices registered to this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No devices registered.{" "}
                  <Link
                    to={`/organizations/${orgId}/workspaces/${workspaceId}/devices`}
                    className="text-primary hover:underline"
                  >
                    Add a device
                  </Link>
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
