import { useParams } from "@tanstack/react-router"
import { useQuery } from "@connectrpc/connect-query"
import { FileCode, ChevronRight } from "lucide-react"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { EditorView } from "@codemirror/view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEndDeviceDefinition } from "@buf/ponix_ponix.connectrpc_query-es/end_device/v1/end_device_definition-EndDeviceDefinitionService_connectquery"
import { useTheme } from "@/components/theme-provider"

export function EndDeviceDefinitionDetail() {
  const { orgId, definitionId } = useParams({ strict: false }) as { orgId: string; definitionId: string }
  const { resolvedTheme } = useTheme()

  const {
    data: definitionResponse,
    isLoading: loading,
    error: queryError,
  } = useQuery(
    getEndDeviceDefinition,
    { organizationId: orgId, id: definitionId },
    { enabled: !!orgId && !!definitionId }
  )

  const definition = definitionResponse?.endDeviceDefinition ?? null
  const error = queryError?.message ?? null

  const formatDate = (timestamp: { seconds: bigint } | undefined) => {
    if (!timestamp) return "N/A"
    return new Date(Number(timestamp.seconds) * 1000).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="border-b">
          <div className="flex h-14 items-center px-6">
            <h1 className="text-lg font-semibold">Loading...</h1>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="py-8 text-center text-muted-foreground">
            Loading definition...
          </div>
        </div>
      </div>
    )
  }

  if (error || !definition) {
    return (
      <div className="flex flex-col">
        <div className="border-b">
          <div className="flex h-14 items-center px-6">
            <h1 className="text-lg font-semibold">Error</h1>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="rounded-md bg-destructive/10 p-4 text-destructive">
            {error || "Definition not found"}
          </div>
        </div>
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
            <span className="text-lg text-muted-foreground">Overview</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Definition ID</CardDescription>
                <CardTitle className="text-sm font-mono">{definition.id}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Created</CardDescription>
                <CardTitle className="text-sm">{formatDate(definition.createdAt)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Updated</CardDescription>
                <CardTitle className="text-sm">{formatDate(definition.updatedAt)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* JSON Schema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">JSON Schema</CardTitle>
              <CardDescription>
                Payload validation schema for this device type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {definition.jsonSchema ? (
                <div className="overflow-hidden rounded-md border">
                  <CodeMirror
                    value={definition.jsonSchema}
                    height="200px"
                    theme={resolvedTheme}
                    extensions={[json(), EditorView.editable.of(false)]}
                    editable={false}
                  />
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  No JSON schema defined
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payload Converter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payload Converter</CardTitle>
              <CardDescription>
                CEL expression for transforming device payloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {definition.payloadConversion ? (
                <div className="overflow-hidden rounded-md border">
                  <CodeMirror
                    value={definition.payloadConversion}
                    height="200px"
                    theme={resolvedTheme}
                    extensions={[EditorView.editable.of(false)]}
                    editable={false}
                  />
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  No payload converter defined
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
