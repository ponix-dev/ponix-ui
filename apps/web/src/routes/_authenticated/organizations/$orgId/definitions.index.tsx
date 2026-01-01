import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery, useMutation } from "@connectrpc/connect-query"
import { FileCode, Plus, ChevronLeft, ChevronRight, Check } from "lucide-react"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { listEndDeviceDefinitions, createEndDeviceDefinition } from "@buf/ponix_ponix.connectrpc_query-es/end_device/v1/end_device_definition-EndDeviceDefinitionService_connectquery"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { definitionsQueryOptions } from "@/lib/queries"

interface NewDefinitionState {
  name: string
  jsonSchema: string
  payloadConversion: string
}

const initialDefinitionState: NewDefinitionState = {
  name: "",
  jsonSchema: "",
  payloadConversion: "",
}

const WIZARD_STEPS = [
  { id: 1, title: "General", description: "Basic information" },
  { id: 2, title: "JSON Schema", description: "Payload validation" },
  { id: 3, title: "Payload Converter", description: "CEL expression" },
]

export const Route = createFileRoute("/_authenticated/organizations/$orgId/definitions/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      definitionsQueryOptions(context.transport, params.orgId)
    )
  },
  component: EndDeviceDefinitionList,
})

function EndDeviceDefinitionList() {
  const { orgId } = Route.useParams()
  const { resolvedTheme } = useTheme()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [newDefinition, setNewDefinition] = useState<NewDefinitionState>(initialDefinitionState)

  const { data: definitionsResponse, refetch } = useSuspenseQuery(listEndDeviceDefinitions, { organizationId: orgId })
  const definitions = definitionsResponse?.endDeviceDefinitions ?? []

  const createMutation = useMutation(createEndDeviceDefinition, {
    onSuccess: () => {
      setNewDefinition(initialDefinitionState)
      setCurrentStep(1)
      setDialogOpen(false)
      refetch()
    },
  })

  const error = createMutation.error?.message || null

  const handleCreateDefinition = () => {
    if (!orgId || !newDefinition.name.trim()) return
    createMutation.mutate({
      organizationId: orgId,
      name: newDefinition.name,
      jsonSchema: newDefinition.jsonSchema,
      payloadConversion: newDefinition.payloadConversion,
    })
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setCurrentStep(1)
      setNewDefinition(initialDefinitionState)
    }
  }

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 1:
        return newDefinition.name.trim().length > 0
      case 2:
        return true
      case 3:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < 3 && canProceedFromStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const formatDate = (timestamp: { seconds: bigint } | undefined) => {
    if (!timestamp) return "N/A"
    return new Date(Number(timestamp.seconds) * 1000).toLocaleDateString()
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Definitions</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">All Definitions</CardTitle>
                <CardDescription>
                  End device definitions for this organization
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Definition
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create End Device Definition</DialogTitle>
                    <DialogDescription>
                      Step {currentStep} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1].title}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex items-center justify-center gap-2 py-2">
                    {WIZARD_STEPS.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                            currentStep > step.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : currentStep === step.id
                                ? "border-primary text-primary"
                                : "border-muted text-muted-foreground"
                          )}
                        >
                          {currentStep > step.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            step.id
                          )}
                        </div>
                        {index < WIZARD_STEPS.length - 1 && (
                          <div
                            className={cn(
                              "mx-2 h-0.5 w-8",
                              currentStep > step.id ? "bg-primary" : "bg-muted"
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="h-[280px] py-4">
                    {currentStep === 1 && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={newDefinition.name}
                            onChange={(e) => setNewDefinition({ ...newDefinition, name: e.target.value })}
                            placeholder="Temperature Sensor v1"
                          />
                          <p className="text-sm text-muted-foreground">
                            A descriptive name for this device definition.
                          </p>
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="grid gap-2">
                        <Label>JSON Schema</Label>
                        <p className="text-sm text-muted-foreground">
                          Define the expected payload structure for validation.
                        </p>
                        <div className="overflow-hidden rounded-md border">
                          <CodeMirror
                            value={newDefinition.jsonSchema}
                            height="200px"
                            theme={resolvedTheme}
                            extensions={[json()]}
                            onChange={(value) => setNewDefinition({ ...newDefinition, jsonSchema: value })}
                            placeholder='{"type": "object", "properties": {...}}'
                          />
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="grid gap-2">
                        <Label>Payload Conversion (CEL)</Label>
                        <p className="text-sm text-muted-foreground">
                          CEL expression to transform raw device payloads.
                        </p>
                        <div className="overflow-hidden rounded-md border">
                          <CodeMirror
                            value={newDefinition.payloadConversion}
                            height="200px"
                            theme={resolvedTheme}
                            onChange={(value) => setNewDefinition({ ...newDefinition, payloadConversion: value })}
                            placeholder="payload.temperature * 1.8 + 32"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex-row justify-between sm:justify-between">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    {currentStep < 3 ? (
                      <Button
                        onClick={handleNext}
                        disabled={!canProceedFromStep(currentStep)}
                      >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCreateDefinition}
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? "Creating..." : "Create Definition"}
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                  {error}
                </div>
              ) : definitions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No definitions configured
                </div>
              ) : (
                <div className="space-y-3">
                  {definitions.map((definition) => (
                    <Link
                      key={definition.id}
                      to="/organizations/$orgId/definitions/$definitionId"
                      params={{ orgId, definitionId: definition.id }}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <FileCode className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{definition.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {definition.id}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {formatDate(definition.createdAt)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
