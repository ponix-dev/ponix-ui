import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery, useMutation } from "@connectrpc/connect-query"
import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt"
import { Cpu, Plus, ChevronLeft, ChevronRight, Check, ChevronsUpDown, Layers } from "lucide-react"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getWorkspace } from "@buf/ponix_ponix.connectrpc_query-es/workspace/v1/workspace-WorkspaceService_connectquery"
import { getWorkspaceDataStreams, createDataStream } from "@buf/ponix_ponix.connectrpc_query-es/data_stream/v1/data_stream-DataStreamService_connectquery"
import { listDataStreamDefinitions } from "@buf/ponix_ponix.connectrpc_query-es/data_stream/v1/data_stream_definition-DataStreamDefinitionService_connectquery"
import { listGateways } from "@buf/ponix_ponix.connectrpc_query-es/gateway/v1/gateway-GatewayService_connectquery"
import { cn } from "@/lib/utils"
import {
  workspaceQueryOptions,
  dataStreamsQueryOptions,
  definitionsQueryOptions,
  gatewaysQueryOptions,
} from "@/lib/queries"

const WIZARD_STEPS = [
  { id: 1, title: "General", description: "Data stream name" },
  { id: 2, title: "Definition", description: "Select definition" },
  { id: 3, title: "Gateway", description: "Select gateway" },
]

export const Route = createFileRoute("/_authenticated/organizations/$orgId/workspaces/$workspaceId/data-streams")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        workspaceQueryOptions(context.transport, params.orgId, params.workspaceId)
      ),
      context.queryClient.ensureQueryData(
        dataStreamsQueryOptions(context.transport, params.orgId, params.workspaceId)
      ),
      context.queryClient.ensureQueryData(
        definitionsQueryOptions(context.transport, params.orgId)
      ),
      context.queryClient.ensureQueryData(
        gatewaysQueryOptions(context.transport, params.orgId)
      ),
    ])
  },
  component: DataStreamList,
})

function DataStreamList() {
  const { orgId, workspaceId } = Route.useParams()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [definitionSearchOpen, setDefinitionSearchOpen] = useState(false)
  const [gatewaySearchOpen, setGatewaySearchOpen] = useState(false)
  const [newDataStream, setNewDataStream] = useState({
    name: "",
    definitionId: "",
    gatewayId: "",
  })

  const { data: workspaceResponse } = useSuspenseQuery(getWorkspace, { organizationId: orgId, workspaceId })
  const workspace = workspaceResponse?.workspace ?? null

  const { data: dataStreamsResponse, refetch: refetchDataStreams } = useSuspenseQuery(
    getWorkspaceDataStreams,
    { organizationId: orgId, workspaceId }
  )
  const dataStreams = dataStreamsResponse?.dataStreams ?? []

  const { data: definitionsResponse } = useSuspenseQuery(listDataStreamDefinitions, { organizationId: orgId })
  const definitions = definitionsResponse?.dataStreamDefinitions ?? []

  const { data: gatewaysResponse } = useSuspenseQuery(listGateways, { organizationId: orgId })
  const gateways = gatewaysResponse?.gateways ?? []

  const createMutation = useMutation(createDataStream, {
    onSuccess: () => {
      setNewDataStream({ name: "", definitionId: "", gatewayId: "" })
      setCurrentStep(1)
      setDialogOpen(false)
      refetchDataStreams()
    },
  })

  const error = createMutation.error?.message || null

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setCurrentStep(1)
      setNewDataStream({ name: "", definitionId: "", gatewayId: "" })
    }
  }

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 1:
        return newDataStream.name.trim().length > 0
      case 2:
        return newDataStream.definitionId !== ""
      case 3:
        return newDataStream.gatewayId !== ""
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

  const handleCreateDataStream = () => {
    if (!orgId || !workspaceId || !newDataStream.name.trim() || !newDataStream.definitionId || !newDataStream.gatewayId) return
    createMutation.mutate({
      organizationId: orgId,
      workspaceId,
      name: newDataStream.name,
      definitionId: newDataStream.definitionId,
      gatewayId: newDataStream.gatewayId,
    })
  }

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "—"
    return timestampDate(timestamp).toLocaleString()
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{workspace?.name ?? "Workspace"}</h1>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">Data Streams</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">All Data Streams</CardTitle>
                <CardDescription>
                  Data streams registered to this workspace
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Data Stream
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Data Stream</DialogTitle>
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
                            value={newDataStream.name}
                            onChange={(e) => setNewDataStream({ ...newDataStream, name: e.target.value })}
                            placeholder="My Data Stream"
                          />
                          <p className="text-sm text-muted-foreground">
                            A descriptive name for this data stream.
                          </p>
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Definition</Label>
                          <Popover open={definitionSearchOpen} onOpenChange={setDefinitionSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={definitionSearchOpen}
                                className="w-full justify-between"
                              >
                                {newDataStream.definitionId
                                  ? definitions.find((def) => def.id === newDataStream.definitionId)?.name
                                  : "Search definitions..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                              <Command>
                                <CommandInput placeholder="Search definitions..." />
                                <CommandList>
                                  <CommandEmpty>No definition found.</CommandEmpty>
                                  <CommandGroup>
                                    {definitions.map((def) => (
                                      <CommandItem
                                        key={def.id}
                                        value={def.name}
                                        onSelect={() => {
                                          setNewDataStream({ ...newDataStream, definitionId: def.id })
                                          setDefinitionSearchOpen(false)
                                        }}
                                      >
                                        {def.name}
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            newDataStream.definitionId === def.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <p className="text-sm text-muted-foreground">
                            The definition determines payload schema and conversion.
                          </p>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Gateway</Label>
                          <Popover open={gatewaySearchOpen} onOpenChange={setGatewaySearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={gatewaySearchOpen}
                                className="w-full justify-between"
                              >
                                {newDataStream.gatewayId
                                  ? gateways.find((gw) => gw.gatewayId === newDataStream.gatewayId)?.name
                                  : "Search gateways..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                              <Command>
                                <CommandInput placeholder="Search gateways..." />
                                <CommandList>
                                  <CommandEmpty>No gateway found.</CommandEmpty>
                                  <CommandGroup>
                                    {gateways.map((gw) => (
                                      <CommandItem
                                        key={gw.gatewayId}
                                        value={gw.name}
                                        onSelect={() => {
                                          setNewDataStream({ ...newDataStream, gatewayId: gw.gatewayId })
                                          setGatewaySearchOpen(false)
                                        }}
                                      >
                                        {gw.name}
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            newDataStream.gatewayId === gw.gatewayId ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <p className="text-sm text-muted-foreground">
                            The gateway this data stream will connect through.
                          </p>
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
                        onClick={handleCreateDataStream}
                        disabled={createMutation.isPending || !canProceedFromStep(currentStep)}
                      >
                        {createMutation.isPending ? "Creating..." : "Create Data Stream"}
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
              ) : dataStreams.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No data streams registered
                </div>
              ) : (
                <div className="space-y-3">
                  {dataStreams.map((dataStream) => (
                    <Link
                      key={dataStream.dataStreamId}
                      to="/organizations/$orgId/data-streams/$dataStreamId/documents"
                      params={{ orgId, dataStreamId: dataStream.dataStreamId }}
                      search={{ workspaceId }}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Cpu className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{dataStream.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {dataStream.dataStreamId}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {formatDate(dataStream.createdAt)}
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
