import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useSuspenseQuery, useMutation } from "@connectrpc/connect-query"
import { FileCode, ChevronRight } from "lucide-react"
import { getDataStreamDefinition } from "@buf/ponix_ponix.connectrpc_query-es/data_stream/v1/data_stream_definition-DataStreamDefinitionService_connectquery"
import { listDefinitionDocuments, createDefinitionDocument } from "@buf/ponix_ponix.connectrpc_query-es/document/v1/document-DocumentService_connectquery"
import { definitionQueryOptions, definitionDocumentsQueryOptions } from "@/lib/queries"
import { DocumentListCard } from "@/components/document-list-card"
import { CreateDocumentDialog } from "@/components/create-document-dialog"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/definitions/$definitionId/documents")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        definitionQueryOptions(context.transport, params.orgId, params.definitionId)
      ),
      context.queryClient.ensureQueryData(
        definitionDocumentsQueryOptions(context.transport, params.orgId, params.definitionId)
      ),
    ])
  },
  component: DefinitionDocuments,
})

function DefinitionDocuments() {
  const { orgId, definitionId } = Route.useParams()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: definitionResponse } = useSuspenseQuery(getDataStreamDefinition, { organizationId: orgId, id: definitionId })
  const definition = definitionResponse?.dataStreamDefinition ?? null

  const { data: documentsResponse, refetch: refetchDocuments } = useSuspenseQuery(listDefinitionDocuments, { organizationId: orgId, definitionId })
  const documents = documentsResponse?.documents ?? []

  const createMutation = useMutation(createDefinitionDocument, {
    onSuccess: (response) => {
      setDialogOpen(false)
      refetchDocuments()
      const doc = response.document
      if (doc) {
        navigate({
          to: "/organizations/$orgId/documents/$documentId",
          params: { orgId, documentId: doc.documentId },
          search: { from: "definition", parentId: definitionId },
        })
      }
    },
  })

  const handleCreate = (name: string) => {
    createMutation.mutate({ organizationId: orgId, definitionId, name })
  }

  if (!definition) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Definition not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{definition.name}</h1>
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
            description="Documents associated with this definition"
            from="definition"
            parentId={definitionId}
          />
        </div>
      </div>
    </div>
  )
}
