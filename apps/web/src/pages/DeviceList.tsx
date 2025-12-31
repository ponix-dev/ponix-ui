import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
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
import {
  endDeviceClient,
  endDeviceDefinitionClient,
  workspaceClient,
  type EndDevice,
  type EndDeviceDefinition,
  type Workspace,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const WIZARD_STEPS = [
  { id: 1, title: "General", description: "Device name" },
  { id: 2, title: "Definition", description: "Select definition" },
]

export function DeviceList() {
  const { orgId, workspaceId } = useParams<{ orgId: string; workspaceId: string }>()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [devices, setDevices] = useState<EndDevice[]>([])
  const [definitions, setDefinitions] = useState<EndDeviceDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create modal state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [definitionSearchOpen, setDefinitionSearchOpen] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: "",
    definitionId: "",
  })

  const fetchData = async () => {
    if (!orgId || !workspaceId) return
    try {
      setLoading(true)
      setError(null)
      const [workspaceResponse, devicesResponse] = await Promise.all([
        workspaceClient.getWorkspace({ organizationId: orgId, workspaceId }),
        endDeviceClient.getWorkspaceEndDevices({ organizationId: orgId, workspaceId }),
      ])
      setWorkspace(workspaceResponse.workspace ?? null)
      setDevices(devicesResponse.endDevices)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const fetchDefinitions = async () => {
    if (!orgId) return
    try {
      const response = await endDeviceDefinitionClient.listEndDeviceDefinitions({
        organizationId: orgId,
      })
      setDefinitions(response.endDeviceDefinitions)
    } catch (err) {
      console.error("Failed to fetch definitions:", err)
    }
  }

  useEffect(() => {
    fetchData()
    fetchDefinitions()
  }, [orgId, workspaceId])

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setCurrentStep(1)
      setNewDevice({ name: "", definitionId: "" })
    }
  }

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 1:
        return newDevice.name.trim().length > 0
      case 2:
        return newDevice.definitionId !== ""
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < 2 && canProceedFromStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreateDevice = async () => {
    if (!orgId || !workspaceId || !newDevice.name.trim() || !newDevice.definitionId) return

    try {
      setCreating(true)
      await endDeviceClient.createEndDevice({
        organizationId: orgId,
        workspaceId,
        name: newDevice.name,
        definitionId: newDevice.definitionId,
      })
      setNewDevice({ name: "", definitionId: "" })
      setCurrentStep(1)
      setDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create device")
    } finally {
      setCreating(false)
    }
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
            <span className="text-lg text-muted-foreground">End Devices</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">All Devices</CardTitle>
                <CardDescription>
                  Devices registered to this workspace
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create End Device</DialogTitle>
                <DialogDescription>
                  Step {currentStep} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1].title}
                </DialogDescription>
              </DialogHeader>

              {/* Step Indicator */}
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

              {/* Step Content */}
              <div className="h-[280px] py-4">
                {/* Step 1: Name */}
                {currentStep === 1 && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newDevice.name}
                        onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                        placeholder="My Device"
                      />
                      <p className="text-sm text-muted-foreground">
                        A descriptive name for this device.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Definition */}
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
                            {newDevice.definitionId
                              ? definitions.find((def) => def.id === newDevice.definitionId)?.name
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
                                      setNewDevice({ ...newDevice, definitionId: def.id })
                                      setDefinitionSearchOpen(false)
                                    }}
                                  >
                                    {def.name}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        newDevice.definitionId === def.id ? "opacity-100" : "opacity-0"
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
                {currentStep < 2 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedFromStep(currentStep)}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreateDevice}
                    disabled={creating || !canProceedFromStep(currentStep)}
                  >
                    {creating ? "Creating..." : "Create Device"}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading devices...
                </div>
              ) : error ? (
                <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                  {error}
                </div>
              ) : devices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No devices registered
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div
                      key={device.deviceId}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Cpu className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {device.deviceId}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {formatDate(device.createdAt)}
                      </div>
                    </div>
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
