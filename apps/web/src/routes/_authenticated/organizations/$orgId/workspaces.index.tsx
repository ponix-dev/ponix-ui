import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery, useMutation } from "@connectrpc/connect-query"
import { Layers, Plus } from "lucide-react"
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
import { listWorkspaces, createWorkspace } from "@buf/ponix_ponix.connectrpc_query-es/workspace/v1/workspace-WorkspaceService_connectquery"
import { workspacesQueryOptions } from "@/lib/queries"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/workspaces/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      workspacesQueryOptions(context.transport, params.orgId)
    )
  },
  component: WorkspaceList,
})

function WorkspaceList() {
  const { orgId } = Route.useParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")

  const { data: workspacesResponse, refetch } = useSuspenseQuery(listWorkspaces, { organizationId: orgId })
  const workspaces = workspacesResponse?.workspaces ?? []

  const createMutation = useMutation(createWorkspace, {
    onSuccess: () => {
      setNewWorkspaceName("")
      setDialogOpen(false)
      refetch()
    },
  })

  const error = createMutation.error?.message || null

  const handleCreateWorkspace = () => {
    if (!orgId || !newWorkspaceName.trim()) return
    createMutation.mutate({
      organizationId: orgId,
      name: newWorkspaceName,
    })
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Workspaces</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">All Workspaces</CardTitle>
                <CardDescription>
                  Click a workspace to manage its devices
                </CardDescription>
              </div>
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
                      disabled={createMutation.isPending || !newWorkspaceName.trim()}
                    >
                      {createMutation.isPending ? "Creating..." : "Create Workspace"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {error ? (
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
                      to="/organizations/$orgId/workspaces/$workspaceId"
                      params={{ orgId, workspaceId: workspace.id }}
                      className="flex items-center rounded-lg border p-4 transition-colors hover:bg-muted/50"
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
