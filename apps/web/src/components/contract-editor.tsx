import { GripVertical, Trash2, ChevronDown } from "lucide-react"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { EditorView } from "@codemirror/view"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useState } from "react"

export interface ContractFormItem {
  id: string
  matchExpression: string
  transformExpression: string
  jsonSchema: string
}

interface ContractEditorProps {
  contract: ContractFormItem
  index: number
  onChange: (updated: ContractFormItem) => void
  onRemove: () => void
  readOnly?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}

export function ContractEditor({
  contract,
  index,
  onChange,
  onRemove,
  readOnly = false,
  dragHandleProps,
}: ContractEditorProps) {
  const { resolvedTheme } = useTheme()
  const [open, setOpen] = useState(true)

  const readOnlyExtensions = readOnly ? [EditorView.editable.of(false)] : []

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border">
        <div className="flex items-center gap-2 px-3 py-2">
          {!readOnly && dragHandleProps && (
            <button
              type="button"
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  !open && "-rotate-90"
                )}
              />
              <span>Contract #{index + 1}</span>
              {contract.matchExpression && (
                <span className="truncate text-xs font-normal text-muted-foreground">
                  — {contract.matchExpression}
                </span>
              )}
            </button>
          </CollapsibleTrigger>
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <CollapsibleContent>
          <div className="space-y-3 border-t px-3 py-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Match Expression (CEL)</Label>
              <div className="overflow-hidden rounded-md border">
                <CodeMirror
                  value={contract.matchExpression}
                  height="60px"
                  theme={resolvedTheme}
                  extensions={readOnlyExtensions}
                  editable={!readOnly}
                  onChange={(value) =>
                    onChange({ ...contract, matchExpression: value })
                  }
                  placeholder='true'
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Transform Expression (CEL)</Label>
              <div className="overflow-hidden rounded-md border">
                <CodeMirror
                  value={contract.transformExpression}
                  height="100px"
                  theme={resolvedTheme}
                  extensions={readOnlyExtensions}
                  editable={!readOnly}
                  onChange={(value) =>
                    onChange({ ...contract, transformExpression: value })
                  }
                  placeholder="payload.temperature * 1.8 + 32"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">JSON Schema</Label>
              <div className="overflow-hidden rounded-md border">
                <CodeMirror
                  value={contract.jsonSchema}
                  height="120px"
                  theme={resolvedTheme}
                  extensions={[json(), ...readOnlyExtensions]}
                  editable={!readOnly}
                  onChange={(value) =>
                    onChange({ ...contract, jsonSchema: value })
                  }
                  placeholder='{"type": "object", "properties": {...}}'
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
