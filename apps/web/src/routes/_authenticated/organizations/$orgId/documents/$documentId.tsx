import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery, useQuery } from "@connectrpc/connect-query"
import { FileText, ChevronRight, Layers, FileCode } from "lucide-react"
import { getDocument } from "@buf/ponix_ponix.connectrpc_query-es/document/v1/document-DocumentService_connectquery"
import { getWorkspace } from "@buf/ponix_ponix.connectrpc_query-es/workspace/v1/workspace-WorkspaceService_connectquery"
import { getDataStreamDefinition } from "@buf/ponix_ponix.connectrpc_query-es/data_stream/v1/data_stream_definition-DataStreamDefinitionService_connectquery"
import { documentQueryOptions } from "@/lib/queries"
import { useCollaboration } from "@/lib/collaboration"
import { CollaborativeEditor } from "@/components/collaborative-editor"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/documents/$documentId")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: (search.from as string) || undefined,
    parentId: (search.parentId as string) || undefined,
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      documentQueryOptions(context.transport, params.orgId, params.documentId)
    )
  },
  component: DocumentDetail,
})

function DocumentDetail() {
  const { orgId, documentId } = Route.useParams()
  const { from, parentId } = Route.useSearch()

  const { data: documentResponse } = useSuspenseQuery(getDocument, { organizationId: orgId, documentId })
  const document = documentResponse?.document ?? null
  const { providerConfig } = useCollaboration({ documentId })

  const { data: workspaceResponse } = useQuery(
    getWorkspace,
    { workspaceId: parentId ?? "", organizationId: orgId },
    { enabled: from === "workspace" && !!parentId }
  )
  const { data: definitionResponse } = useQuery(
    getDataStreamDefinition,
    { id: parentId ?? "", organizationId: orgId },
    { enabled: from === "definition" && !!parentId }
  )

  const parentName = from === "workspace"
    ? workspaceResponse?.workspace?.name
    : from === "definition"
      ? definitionResponse?.dataStreamDefinition?.name
      : undefined

  const ParentIcon = from === "workspace" ? Layers : from === "definition" ? FileCode : null

  if (!document) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Document not found</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-2">
            {ParentIcon && parentName ? (
              <>
                <ParentIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">{parentName}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg text-muted-foreground">{document.name}</span>
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-lg font-semibold">{document.name}</h1>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <CollaborativeEditor
          providerConfig={providerConfig}
          documentId={documentId}
        />
      </div>
    </div>
  )
}
