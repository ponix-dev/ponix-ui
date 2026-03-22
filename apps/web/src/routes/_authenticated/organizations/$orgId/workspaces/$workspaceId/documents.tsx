import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useSuspenseQuery, useMutation } from "@connectrpc/connect-query"
import { Layers, ChevronRight } from "lucide-react"
import { getWorkspace } from "@buf/ponix_ponix.connectrpc_query-es/workspace/v1/workspace-WorkspaceService_connectquery"
import { listWorkspaceDocuments, createWorkspaceDocument } from "@buf/ponix_ponix.connectrpc_query-es/document/v1/document-DocumentService_connectquery"
import { workspaceQueryOptions, workspaceDocumentsQueryOptions } from "@/lib/queries"
import { DocumentListCard } from "@/components/document-list-card"
import { CreateDocumentDialog } from "@/components/create-document-dialog"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/workspaces/$workspaceId/documents")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        workspaceQueryOptions(context.transport, params.orgId, params.workspaceId)
      ),
      context.queryClient.ensureQueryData(
        workspaceDocumentsQueryOptions(context.transport, params.orgId, params.workspaceId)
      ),
    ])
  },
  component: WorkspaceDocuments,
})

function WorkspaceDocuments() {
  const { orgId, workspaceId } = Route.useParams()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: workspaceResponse } = useSuspenseQuery(getWorkspace, { organizationId: orgId, workspaceId })
  const workspace = workspaceResponse?.workspace ?? null

  const { data: documentsResponse, refetch: refetchDocuments } = useSuspenseQuery(listWorkspaceDocuments, { organizationId: orgId, workspaceId })
  const documents = documentsResponse?.documents ?? []

  const createMutation = useMutation(createWorkspaceDocument, {
    onSuccess: (response) => {
      setDialogOpen(false)
      refetchDocuments()
      const doc = response.document
      if (doc) {
        navigate({
          to: "/organizations/$orgId/documents/$documentId",
          params: { orgId, documentId: doc.documentId },
          search: { from: "workspace", parentId: workspaceId },
        })
      }
    },
  })

  const handleCreate = (name: string) => {
    createMutation.mutate({ organizationId: orgId, workspaceId, name })
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
      <div className="border-b">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{workspace.name}</h1>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">Documents</span>
          </div>
          <CreateDocumentDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSubmit={handleCreate}
            isPending={createMutation.isPending}
            error={createMutation.error?.message ?? null}
          />
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <DocumentListCard
            orgId={orgId}
            documents={documents}
            description="Documents associated with this workspace"
            from="workspace"
            parentId={workspaceId}
          />
        </div>
      </div>
    </div>
  )
}
