import { useMemo } from "react"
import { useNavigate } from "@tanstack/react-router"
import { getAccessToken } from "@/lib/api"
import { useAuth } from "@/lib/auth"
// Side-effect import: registers "ponix" provider type with @platejs/yjs
import "./provider"
import type { PonixProviderOptions } from "./provider"

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:50052"

interface UseCollaborationOptions {
  documentId: string
}

export interface PonixProviderConfig {
  type: "ponix"
  options: PonixProviderOptions
}

export function useCollaboration({ documentId }: UseCollaborationOptions) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const providerConfig: PonixProviderConfig = useMemo(() => ({
    type: "ponix" as const,
    options: {
      wsUrl: WS_URL,
      documentId,
      getToken: () => getAccessToken(),
      onAuthFailure: () => {
        navigate({ to: "/login", search: { redirect: undefined } })
      },
      user: user ? { id: user.id, name: user.name, email: user.email } : undefined,
    },
  }), [documentId, navigate, user])

  return { providerConfig }
}
