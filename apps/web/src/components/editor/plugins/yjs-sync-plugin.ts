import { createPlatePlugin } from "platejs/react"
import { YjsEditor, CursorEditor } from "@slate-yjs/core"

/**
 * Belt-and-suspenders plugin for Yjs change flushing + cursor sending.
 *
 * The canonical path is: Slate apply() → microtask → editor.onChange() →
 * withYjs flushes changes → withCursors sends cursor position.
 *
 * This plugin uses Plate's handlers.onChange (fired from <Slate>'s onChange
 * callback, a separate mechanism) as a reliable fallback. If the canonical
 * path already ran, these calls are cheap no-ops.
 */
console.log("[yjs-sync] MODULE LOADED")

let logCount = 0

export const YjsSyncPlugin = createPlatePlugin({
  key: "yjs-sync",
  handlers: {
    onChange: ({ editor }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = editor as any
      const isYjs = YjsEditor.isYjsEditor(e)
      const connected = isYjs && YjsEditor.connected(e)
      const isCursor = CursorEditor.isCursorEditor(e)

      if (logCount < 10) {
        logCount++
        console.log("[yjs-sync]", {
          isYjs,
          connected,
          isCursor,
          hasSelection: !!e.selection,
          hasSharedRoot: !!e.sharedRoot,
          hasAwareness: !!e.awareness,
        })
      }

      if (!isYjs || !connected) return

      YjsEditor.flushLocalChanges(e)

      if (isCursor && e.selection) {
        try {
          CursorEditor.sendCursorPosition(e)
          if (logCount <= 10) {
            const localState = e.awareness?.getLocalState?.()
            console.log("[yjs-sync] cursor sent, awareness:", {
              cursor: !!localState?.cursor,
              keys: Object.keys(localState ?? {}),
            })
          }
        } catch (err) {
          console.warn("[yjs-sync] sendCursorPosition failed:", err)
        }
      }
    },
  },
})
