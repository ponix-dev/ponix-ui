import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Layers, Plus } from "lucide-react"
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
  workspaceClient,
  type Workspace,
  WorkspaceStatus,
} from "@/lib/api"

export function WorkspaceList() {
  const { orgId } = useParams<{ orgId: string }>()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create modal state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")

  const fetchWorkspaces = async () => {
    if (!orgId) return
    try {
      setLoading(true)
      setError(null)
      const response = await workspaceClient.listWorkspaces({ organizationId: orgId })
      setWorkspaces(response.workspaces)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workspaces")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspaces()
  }, [orgId])

  const handleCreateWorkspace = async () => {
    if (!orgId || !newWorkspaceName.trim()) return

    try {
      setCreating(true)
      await workspaceClient.createWorkspace({
        organizationId: orgId,
        name: newWorkspaceName,
      })
      setNewWorkspaceName("")
      setDialogOpen(false)
      fetchWorkspaces()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace")
    } finally {
      setCreating(false)
    }
  }

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

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Workspaces</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Workspace</DialogTitle>
                <DialogDescription>
                  Create a new workspace to organize your devices.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="My Workspace"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={creating || !newWorkspaceName.trim()}
                >
                  {creating ? "Creating..." : "Create Workspace"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Workspaces</CardDescription>
                <CardTitle className="text-3xl">{workspaces.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active</CardDescription>
                <CardTitle className="text-3xl">
                  {workspaces.filter(w => w.status === WorkspaceStatus.ACTIVE).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Workspaces</CardTitle>
              <CardDescription>
                Click a workspace to manage its devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading workspaces...
                </div>
              ) : error ? (
                <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                  {error}
                </div>
              ) : workspaces.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No workspaces created yet
                </div>
              ) : (
                <div className="space-y-3">
                  {workspaces.map((workspace) => (
                    <Link
                      key={workspace.id}
                      to={`/organizations/${orgId}/workspaces/${workspace.id}`}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Layers className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{workspace.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {workspace.id}
                          </div>
                        </div>
                      </div>
                      <Badge variant={statusVariant(workspace.status)}>
                        {statusLabel(workspace.status)}
                      </Badge>
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
