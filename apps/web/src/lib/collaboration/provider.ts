import * as Y from "yjs"
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from "y-protocols/awareness"
import { registerProviderType, type UnifiedProvider } from "@platejs/yjs"

export interface PonixProviderOptions {
  wsUrl: string
  documentId: string
  getToken: () => string | null
  onAuthFailure?: () => void
  user?: { id: string; name: string; email: string }
}

/**
 * Custom WebSocket provider for the Ponix collaboration server.
 *
 * Registered as provider type "ponix" with @platejs/yjs so the plugin
 * can instantiate it with proper lifecycle callbacks (onConnect, onDisconnect,
 * onSyncChange). Uses first-text-frame JWT auth. Awareness uses standard
 * y-protocols lib0 varint encoding.
 */
export class PonixProvider implements UnifiedProvider {
  type = "ponix"

  private _doc: Y.Doc
  private _awareness: Awareness
  private _isConnected = false
  private _isSynced = false
  private wsUrl: string
  private documentId: string
  private getToken: () => string | null
  private onAuthFailureCb?: () => void
  private onConnectCb?: () => void
  private onDisconnectCb?: () => void
  private onSyncChangeCb?: (isSynced: boolean) => void
  private ws: WebSocket | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private retryDelay = 1000
  private destroyed = false

  private user?: { id: string; name: string; email: string }
  private onDocUpdate: (update: Uint8Array, origin: unknown) => void
  private onAwarenessUpdate: (changes: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => void
  private lastSentAwareness: string | null = null

  constructor({
    doc,
    awareness,
    options,
    onConnect,
    onDisconnect,
    onSyncChange,
  }: {
    doc?: Y.Doc
    awareness?: Awareness
    options: PonixProviderOptions
    onConnect?: () => void
    onDisconnect?: () => void
    onError?: (error: Error) => void
    onSyncChange?: (isSynced: boolean) => void
  }) {
    this._doc = doc ?? new Y.Doc()
    this._awareness = awareness ?? new Awareness(this._doc)
    this.wsUrl = options.wsUrl
    this.documentId = options.documentId
    this.getToken = options.getToken
    this.onAuthFailureCb = options.onAuthFailure
    this.user = options.user
    this.onConnectCb = onConnect
    this.onDisconnectCb = onDisconnect
    this.onSyncChangeCb = onSyncChange

    this.onDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === this || !this.ws || this.ws.readyState !== WebSocket.OPEN) return
      const msg = new Uint8Array(2 + update.length)
      msg[0] = 0x00
      msg[1] = 0x02
      msg.set(update, 2)
      this.ws.send(msg)
    }

    this.onAwarenessUpdate = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
      // Only send our own state, and only when it actually changed
      const localId = this._awareness.clientID
      const changedClients = added.concat(updated).concat(removed)
      if (!changedClients.includes(localId)) return
      const localState = this._awareness.getLocalState()
      const serialized = JSON.stringify(localState)
      if (serialized === this.lastSentAwareness) return
      this.lastSentAwareness = serialized
      const update = encodeAwarenessUpdate(this._awareness, [localId])
      const msg = new Uint8Array(1 + update.length)
      msg[0] = 0x01
      msg.set(update, 1)
      this.ws.send(msg)
    }
  }

  get awareness(): Awareness {
    return this._awareness
  }

  get document(): Y.Doc {
    return this._doc
  }

  get isConnected(): boolean {
    return this._isConnected
  }

  get isSynced(): boolean {
    return this._isSynced
  }

  connect(): void {
    if (this.destroyed) return

    const token = this.getToken()
    if (!token) {
      this.onAuthFailureCb?.()
      return
    }

    const url = `${this.wsUrl}/ws/documents/${this.documentId}`
    const ws = new WebSocket(url)
    ws.binaryType = "arraybuffer"
    this.ws = ws

    ws.onopen = () => {
      ws.send(token)
      this.retryDelay = 1000
      this._isConnected = true
      this.onConnectCb?.()

      // Set local user info so remote peers see our identity
      if (this.user) {
        this._awareness.setLocalStateField("user_id", this.user.id)
        this._awareness.setLocalStateField("name", this.user.name)
        this._awareness.setLocalStateField("email", this.user.email)
        this._awareness.setLocalStateField("color", this.generateUserColor(this.user.id))
      }

      this._doc.on("update", this.onDocUpdate)
      this._awareness.on("update", this.onAwarenessUpdate)
    }

    ws.onmessage = (event) => {
      if (typeof event.data === "string") return
      this.handleMessage(new Uint8Array(event.data as ArrayBuffer))
    }

    ws.onclose = (event) => {
      this.handleClose(event.code)
    }

    ws.onerror = () => {}
  }

  disconnect(): void {
    this.removeListeners()
    const wasConnected = this._isConnected
    this._isConnected = false

    if (this._isSynced) {
      this._isSynced = false
      this.onSyncChangeCb?.(false)
    }
    if (wasConnected) {
      this.onDisconnectCb?.()
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }

    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close()
      }
      this.ws = null
    }
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.disconnect()
  }

  private handleMessage(data: Uint8Array): void {
    if (data.length === 0) return

    const tag = data[0]
    const payload = data.slice(1)

    if (tag === 0x00) {
      this.handleSyncMessage(payload)
    } else if (tag === 0x01 && payload.length > 0) {
      try {
        applyAwarenessUpdate(this._awareness, payload, this)
      } catch (e) {
        console.warn("[ponix-ws] Failed to apply awareness update:", e)
      }
    }
  }

  private handleSyncMessage(payload: Uint8Array): void {
    if (payload.length === 0) return

    const subTag = payload[0]
    const data = payload.slice(1)

    switch (subTag) {
      case 0x00: {
        const update = Y.encodeStateAsUpdate(this._doc, data)
        const msg = new Uint8Array(2 + update.length)
        msg[0] = 0x00
        msg[1] = 0x01
        msg.set(update, 2)
        this.ws?.send(msg)
        break
      }
      case 0x01:
        Y.applyUpdate(this._doc, data, this)
        if (!this._isSynced) {
          this._isSynced = true
          this.onSyncChangeCb?.(true)
        }
        break
      case 0x02:
        Y.applyUpdate(this._doc, data, this)
        break
    }
  }

  private handleClose(code: number): void {
    this.removeListeners()
    const wasConnected = this._isConnected
    this._isConnected = false

    if (this._isSynced) {
      this._isSynced = false
      this.onSyncChangeCb?.(false)
    }
    if (wasConnected) {
      this.onDisconnectCb?.()
    }

    if (code === 4001) {
      this.onAuthFailureCb?.()
      return
    }

    if (this.destroyed) return

    this.retryTimer = setTimeout(() => {
      this.connect()
    }, this.retryDelay)
    this.retryDelay = Math.min(this.retryDelay * 2, 10000)
  }

  private generateUserColor(userId: string): string {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 45%)`
  }

  private removeListeners(): void {
    this._doc.off("update", this.onDocUpdate)
    this._awareness.off("update", this.onAwarenessUpdate)
  }
}

// Register so YjsPlugin can instantiate via config with proper lifecycle callbacks
registerProviderType("ponix", PonixProvider)
