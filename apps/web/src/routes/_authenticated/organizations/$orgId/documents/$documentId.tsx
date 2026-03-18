import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useSuspenseQuery, useMutation } from "@connectrpc/connect-query"
import { FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getDocument, deleteDocument } from "@buf/ponix_ponix.connectrpc_query-es/document/v1/document-DocumentService_connectquery"
import { documentQueryOptions } from "@/lib/queries"

export const Route = createFileRoute("/_authenticated/organizations/$orgId/documents/$documentId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      documentQueryOptions(context.transport, params.orgId, params.documentId)
    )
  },
  component: DocumentDetail,
})

function DocumentDetail() {
  const { orgId, documentId } = Route.useParams()
  const navigate = useNavigate()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data: documentResponse } = useSuspenseQuery(getDocument, { organizationId: orgId, documentId })
  const document = documentResponse?.document ?? null

  const deleteMutation = useMutation(deleteDocument, {
    onSuccess: () => {
      navigate({ to: "/organizations/$orgId", params: { orgId } })
    },
    onError: (error) => {
      setDeleteError(error.message)
    },
  })

  const formatDate = (timestamp: { seconds: bigint } | undefined) => {
    if (!timestamp) return "N/A"
    return new Date(Number(timestamp.seconds) * 1000).toLocaleString()
  }

  if (!document) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Document not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center gap-4 px-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{document.name}</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Document ID</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-xs text-muted-foreground">{document.documentId}</code>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{formatDate(document.createdAt)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Updated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{formatDate(document.updatedAt)}</div>
              </CardContent>
            </Card>
          </div>

          {document.contentText && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content</CardTitle>
                <CardDescription>
                  Document content preview (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                  {document.contentText}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
              <CardDescription>
                Manage this document
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deleteError && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {deleteError}
                </div>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleteMutation.isPending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleteMutation.isPending ? "Deleting..." : "Delete Document"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete document?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{document.name}" and remove all its associations.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate({ organizationId: orgId, documentId })}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
