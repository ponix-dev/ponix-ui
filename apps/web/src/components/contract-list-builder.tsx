import { useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContractEditor, type ContractFormItem } from "@/components/contract-editor"

interface ContractListBuilderProps {
  contracts: ContractFormItem[]
  onChange: (contracts: ContractFormItem[]) => void
}

function SortableContractItem({
  contract,
  index,
  onChange,
  onRemove,
}: {
  contract: ContractFormItem
  index: number
  onChange: (updated: ContractFormItem) => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contract.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ContractEditor
        contract={contract}
        index={index}
        onChange={onChange}
        onRemove={onRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

let nextId = 1
export function generateContractId() {
  return `contract-${Date.now()}-${nextId++}`
}

export function createEmptyContract(
  matchExpression = ""
): ContractFormItem {
  return {
    id: generateContractId(),
    matchExpression,
    transformExpression: "",
    jsonSchema: "",
  }
}

export function ContractListBuilder({
  contracts,
  onChange,
}: ContractListBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        const oldIndex = contracts.findIndex((c) => c.id === active.id)
        const newIndex = contracts.findIndex((c) => c.id === over.id)
        onChange(arrayMove(contracts, oldIndex, newIndex))
      }
    },
    [contracts, onChange]
  )

  const handleAdd = () => {
    onChange([...contracts, createEmptyContract()])
  }

  const handleUpdate = (index: number, updated: ContractFormItem) => {
    const next = [...contracts]
    next[index] = updated
    onChange(next)
  }

  const handleRemove = (index: number) => {
    onChange(contracts.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {contracts.length === 0 && (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          No contracts defined. Add at least one contract.
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={contracts.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {contracts.map((contract, index) => (
            <SortableContractItem
              key={contract.id}
              contract={contract}
              index={index}
              onChange={(updated) => handleUpdate(index, updated)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleAdd}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Contract
      </Button>
    </div>
  )
}
