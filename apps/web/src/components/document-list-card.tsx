import { Link } from "@tanstack/react-router"
import { FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Document } from "@/lib/api"

interface DocumentListCardProps {
  orgId: string
  documents: Document[]
  title?: string
  description?: string
  from?: "workspace" | "definition" | "datastream"
  parentId?: string
  workspaceId?: string
}

export function DocumentListCard({
  orgId,
  documents,
  title = "Documents",
  description = "Documents associated with this resource",
  from,
  parentId,
  workspaceId,
}: DocumentListCardProps) {
  const formatDate = (timestamp: { seconds: bigint } | undefined) => {
    if (!timestamp) return "N/A"
    return new Date(Number(timestamp.seconds) * 1000).toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No documents yet
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Link
                key={doc.documentId}
                to="/organizations/$orgId/documents/$documentId"
                params={{ orgId, documentId: doc.documentId }}
                search={{ from, parentId, workspaceId }}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {doc.documentId}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {formatDate(doc.updatedAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
