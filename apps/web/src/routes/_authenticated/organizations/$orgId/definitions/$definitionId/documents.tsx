import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@connectrpc/connect-query"
import { FileCode, ChevronRight } from "lucide-react"
import { getDataStreamDefinition } from "@buf/ponix_ponix.connectrpc_query-es/data_stream/v1/data_stream_definition-DataStreamDefinitionService_connectquery"
import { listDefinitionDocuments } from "@buf/ponix_ponix.connectrpc_query-es/document/v1/document-DocumentService_connectquery"
import { definitionQueryOptions, definitionDocumentsQueryOptions } from "@/lib/queries"
import { DocumentListCard } from "@/components/document-list-card"

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

  const { data: definitionResponse } = useSuspenseQuery(getDataStreamDefinition, { organizationId: orgId, id: definitionId })
  const definition = definitionResponse?.dataStreamDefinition ?? null

  const { data: documentsResponse } = useSuspenseQuery(listDefinitionDocuments, { organizationId: orgId, definitionId })
  const documents = documentsResponse?.documents ?? []

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
        <div className="flex h-14 items-center gap-4 px-6">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{definition.name}</h1>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">Documents</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <DocumentListCard
            orgId={orgId}
            documents={documents}
            description="Documents associated with this definition"
          />
        </div>
      </div>
    </div>
  )
}
