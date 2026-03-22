import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation } from "@connectrpc/connect-query"
import { Cpu, ChevronRight } from "lucide-react"
import { getDataStream } from "@buf/ponix_ponix.connectrpc_query-es/data_stream/v1/data_stream-DataStreamService_connectquery"
import { listDataStreamDocuments, createDataStreamDocument } from "@buf/ponix_ponix.connectrpc_query-es/document/v1/document-DocumentService_connectquery"
import { dataStreamDocumentsQueryOptions } from "@/lib/queries"
import { DocumentListCard } from "@/components/document-list-card"
import { CreateDocumentDialog } from "@/components/create-document-dialog"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/data-streams/$dataStreamId/documents")({
  validateSearch: (search: Record<string, unknown>) => ({
    workspaceId: (search.workspaceId as string) || "",
  }),
  loaderDeps: ({ search }) => ({ workspaceId: search.workspaceId }),
  loader: async ({ context, params, deps }) => {
    if (deps.workspaceId) {
      await context.queryClient.ensureQueryData(
        dataStreamDocumentsQueryOptions(context.transport, params.orgId, deps.workspaceId, params.dataStreamId)
      )
    }
  },
  component: DataStreamDocuments,
})

function DataStreamDocuments() {
  const { orgId, dataStreamId } = Route.useParams()
  const { workspaceId } = Route.useSearch()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: dataStreamResponse } = useQuery(
    getDataStream,
    { organizationId: orgId, workspaceId, dataStreamId },
    { enabled: !!workspaceId },
  )
  const dataStream = dataStreamResponse?.dataStream ?? null

  const { data: documentsResponse, refetch: refetchDocuments } = useQuery(
    listDataStreamDocuments,
    { organizationId: orgId, workspaceId, dataStreamId },
    { enabled: !!workspaceId },
  )
  const documents = documentsResponse?.documents ?? []

  const createMutation = useMutation(createDataStreamDocument, {
    onSuccess: (response) => {
      setDialogOpen(false)
      refetchDocuments()
      const doc = response.document
      if (doc) {
        navigate({
          to: "/organizations/$orgId/documents/$documentId",
          params: { orgId, documentId: doc.documentId },
          search: { from: "datastream", parentId: dataStreamId, workspaceId },
        })
      }
    },
  })

  const handleCreate = (name: string) => {
    createMutation.mutate({ organizationId: orgId, workspaceId, dataStreamId, name })
  }

  if (!dataStream) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Loading data stream...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{dataStream.name}</h1>
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
            description="Documents associated with this data stream"
            from="datastream"
            parentId={dataStreamId}
            workspaceId={workspaceId}
          />
        </div>
      </div>
    </div>
  )
}
