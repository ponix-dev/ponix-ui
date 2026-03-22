import { useEffect, useState, useCallback, useSyncExternalStore } from "react"
import { useEditorRef } from "platejs/react"
import { List } from "lucide-react"
import { cn } from "@/lib/utils"

const HEADING_TYPES = ["h1", "h2", "h3", "h4", "h5", "h6"] as const

export interface TocEntry {
  id: string
  text: string
  level: number
  path: number[]
}

function getNodeText(node: { children?: { text?: string }[] }): string {
  if (!node.children) return ""
  return node.children
    .map((child: { text?: string }) => child.text ?? "")
    .join("")
}

// --- External store so sidebar (sibling) can read TOC entries ---

type ScrollToFn = (entry: TocEntry) => void

interface TocStore {
  entries: TocEntry[]
  scrollTo: ScrollToFn | null
}

let storeState: TocStore = { entries: [], scrollTo: null }
const listeners = new Set<() => void>()

function getSnapshot() {
  return storeState
}

function setStore(next: Partial<TocStore>) {
  storeState = { ...storeState, ...next }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useToc() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Place inside <Plate> to extract headings into the shared store.
 * Renders children (wrap the editor area with this).
 */
export function TocProvider({ children }: { children: React.ReactNode }) {
  const editor = useEditorRef()

  const extractHeadings = useCallback(() => {
    const headings: TocEntry[] = []

    for (const [node, path] of editor.api.nodes({
      at: [],
      match: (n: { type?: string }) => HEADING_TYPES.includes(n.type as typeof HEADING_TYPES[number]),
    })) {
      const type = (node as { type: string }).type
      const level = parseInt(type.charAt(1), 10)
      const text = getNodeText(node as { children?: { text?: string }[] })
      if (!text.trim()) continue

      headings.push({
        id: `toc-${path.join("-")}`,
        text: text.trim(),
        level,
        path: [...path],
      })
    }

    setStore({ entries: headings })
  }, [editor])

  const scrollTo = useCallback((entry: TocEntry) => {
    try {
      const point = editor.api.point(entry.path, { edge: "start" })
      if (point) {
        editor.tf.select(point)
        editor.tf.focus()
      }
    } catch {
      extractHeadings()
    }
  }, [editor, extractHeadings])

  useEffect(() => {
    setStore({ scrollTo })
    extractHeadings()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const origOnChange = editor.onChange as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor.onChange = (options: any) => {
      origOnChange(options)
      try { extractHeadings() } catch { /* ignore during Yjs remote sync */ }
    }

    return () => {
      editor.onChange = origOnChange
      setStore({ entries: [], scrollTo: null })
    }
  }, [editor, extractHeadings, scrollTo])

  return <>{children}</>
}

// --- Renderable TOC (works anywhere — reads from the external store) ---

export function TableOfContents() {
  const { entries, scrollTo } = useToc()
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleClick = (entry: TocEntry) => {
    scrollTo?.(entry)
    setActiveId(entry.id)
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <List className="mb-2 h-5 w-5" />
        <p className="text-xs">No headings yet</p>
      </div>
    )
  }

  return (
    <nav aria-label="Table of contents">
      <ul className="space-y-0.5">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => handleClick(entry)}
              className={cn(
                "w-full truncate rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                activeId === entry.id && "bg-accent/50 text-accent-foreground font-medium",
                entry.level === 1 && "font-medium",
                entry.level === 2 && "pl-5",
                entry.level === 3 && "pl-7 text-muted-foreground",
                entry.level === 4 && "pl-9 text-muted-foreground text-xs",
                entry.level === 5 && "pl-11 text-muted-foreground text-xs",
                entry.level === 6 && "pl-12 text-muted-foreground text-xs",
              )}
            >
              {entry.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
