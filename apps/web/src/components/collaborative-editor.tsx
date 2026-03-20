import { useEffect, useState } from "react"
import { Plate, usePlateEditor, usePluginOption } from "platejs/react"
import { YjsPlugin } from "@platejs/yjs/react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useRemoteCursorDecorations, RemoteCursorLeaf } from "@/components/ui/cursor-overlay"
import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit"
import { Editor, EditorContainer } from "@/components/ui/editor"
import { TocProvider } from "@/components/table-of-contents"
import type { PonixProviderConfig } from "@/lib/collaboration"
import type { Awareness } from "y-protocols/awareness"

interface CollaborativeEditorProps {
  providerConfig: PonixProviderConfig
  documentId: string
}

interface RemoteUser {
  clientId: number
  user_id?: string
  name?: string
  email?: string
  color?: string
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return "?"
}

function useRemoteUsers(awareness: Awareness | null): RemoteUser[] {
  const [users, setUsers] = useState<RemoteUser[]>([])

  useEffect(() => {
    if (!awareness) return

    const update = () => {
      const next: RemoteUser[] = []
      awareness.states.forEach((state, clientId) => {
        if (clientId === awareness.clientID) return
        if (!state || Object.keys(state).length === 0) return
        next.push({
          clientId,
          user_id: state.user_id as string | undefined,
          name: state.name as string | undefined,
          email: state.email as string | undefined,
          color: state.color as string | undefined,
        })
      })
      setUsers(next)
    }

    update()
    awareness.on("update", update)
    return () => awareness.off("update", update)
  }, [awareness])

  return users
}

function PresenceAvatars() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awareness = usePluginOption(YjsPlugin as any, "awareness") as Awareness | null
  const remoteUsers = useRemoteUsers(awareness)

  if (remoteUsers.length === 0) return null

  return (
    <TooltipProvider>
      <div className="flex -space-x-2">
        {remoteUsers.map((user) => (
          <Tooltip key={user.clientId}>
            <TooltipTrigger asChild>
              <Avatar className="size-7 border-2 border-background">
                <AvatarFallback
                  className="text-xs font-medium text-white"
                  style={{ backgroundColor: user.color || "#6b7280" }}
                >
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name || user.email || "Anonymous"}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

export function CollaborativeEditor({ providerConfig, documentId }: CollaborativeEditorProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isSynced, setIsSynced] = useState(false)

  const editor = usePlateEditor(
    {
      plugins: [
        ...BasicNodesKit,
        YjsPlugin.configure({
          options: {
            // Cast needed: YjsProviderConfig union only includes built-in types,
            // but registerProviderType() makes custom types work at runtime.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            providers: [providerConfig as any],
            cursors: {
              data: {
                style: { backgroundColor: "rgba(99, 102, 241, 0.5)" },
                selectionStyle: { backgroundColor: "rgba(99, 102, 241, 0.25)" },
              },
            },
            onConnect: () => setIsConnected(true),
            onDisconnect: () => setIsConnected(false),
            onSyncChange: ({ isSynced: synced }) => setIsSynced(synced),
          },
        }),
      ],
      skipInitialization: true,
    },
    [providerConfig],
  )

  useEffect(() => {
    editor.getApi(YjsPlugin).yjs.init({
      id: documentId,
      autoConnect: true,
    })

    return () => {
      editor.getApi(YjsPlugin).yjs.destroy()
    }
  }, [editor, documentId])

  const statusConfig = isSynced
    ? { label: "Connected", className: "bg-green-500/15 text-green-700 border-green-500/25" }
    : isConnected
      ? { label: "Connecting", className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/25" }
      : { label: "Disconnected", className: "bg-red-500/15 text-red-700 border-red-500/25" }

  return (
    <Plate editor={editor}>
      <TocProvider>
        <div className="flex items-center justify-end gap-3 px-4 py-2">
          <PresenceAvatars />
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>
        <CollaborativeEditorContent />
      </TocProvider>
    </Plate>
  )
}

/** Inner component rendered inside <Plate> so hooks have access to editor context. */
function CollaborativeEditorContent() {
  const decorate = useRemoteCursorDecorations()

  return (
    <EditorContainer>
      <Editor
        placeholder="Start writing..."
        decorate={decorate}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderLeaf={(props: any) => <RemoteCursorLeaf {...props} />}
      />
    </EditorContainer>
  )
}
