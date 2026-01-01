import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery, useMutation } from "@connectrpc/connect-query"
import { Radio, Plus, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listGateways, createGateway } from "@buf/ponix_ponix.connectrpc_query-es/gateway/v1/gateway-GatewayService_connectquery"
import { GatewayType } from "@/lib/api"
import { cn } from "@/lib/utils"
import { gatewaysQueryOptions } from "@/lib/queries"

type GatewayTypeKey = "emqx"

interface EmqxConfig {
  brokerUrl: string
  subscriptionGroup: string
}

interface NewGatewayState {
  name: string
  type: GatewayTypeKey | ""
  emqxConfig: EmqxConfig
}

const initialGatewayState: NewGatewayState = {
  name: "",
  type: "",
  emqxConfig: { brokerUrl: "", subscriptionGroup: "" },
}

const WIZARD_STEPS = [
  { id: 1, title: "General", description: "Name and type" },
  { id: 2, title: "Configuration", description: "Gateway settings" },
]

export const Route = createFileRoute("/_authenticated/organizations/$orgId/gateways/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      gatewaysQueryOptions(context.transport, params.orgId)
    )
  },
  component: GatewayList,
})

function GatewayList() {
  const { orgId } = Route.useParams()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [newGateway, setNewGateway] = useState<NewGatewayState>(initialGatewayState)

  const { data: gatewaysResponse, refetch } = useSuspenseQuery(listGateways, { organizationId: orgId })
  const gateways = gatewaysResponse?.gateways ?? []

  const createMutation = useMutation(createGateway, {
    onSuccess: () => {
      setNewGateway(initialGatewayState)
      setDialogOpen(false)
      setCurrentStep(1)
      refetch()
    },
  })

  const error = createMutation.error?.message || null

  const handleCreateGateway = () => {
    if (!orgId || !newGateway.name.trim() || !newGateway.type) return

    if (newGateway.type === "emqx") {
      if (!newGateway.emqxConfig.brokerUrl.trim()) return
      createMutation.mutate({
        organizationId: orgId,
        name: newGateway.name,
        type: GatewayType.EMQX,
        config: {
          case: "emqxConfig",
          value: {
            brokerUrl: newGateway.emqxConfig.brokerUrl,
            subscriptionGroup: newGateway.emqxConfig.subscriptionGroup || undefined,
          },
        },
      })
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setCurrentStep(1)
      setNewGateway(initialGatewayState)
    }
  }

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 1:
        return newGateway.name.trim().length > 0 && newGateway.type !== ""
      case 2:
        if (newGateway.type === "emqx") {
          return newGateway.emqxConfig.brokerUrl.trim().length > 0 &&
                 newGateway.emqxConfig.subscriptionGroup.trim().length > 0
        }
        return true
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

  const typeLabel = (type: GatewayType) => {
    switch (type) {
      case GatewayType.EMQX:
        return "EMQX"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Gateways</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">All Gateways</CardTitle>
                <CardDescription>
                  IoT gateways connected to this organization
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Gateway
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Gateway</DialogTitle>
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
                            value={newGateway.name}
                            onChange={(e) => setNewGateway({ ...newGateway, name: e.target.value })}
                            placeholder="My Gateway"
                          />
                          <p className="text-sm text-muted-foreground">
                            A descriptive name for this gateway.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Label>Gateway Type</Label>
                          <Select
                            value={newGateway.type}
                            onValueChange={(value: GatewayTypeKey) => setNewGateway({ ...newGateway, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a gateway type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="emqx">EMQX</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            The type of gateway determines the configuration options.
                          </p>
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && newGateway.type === "emqx" && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="brokerUrl">Broker URL</Label>
                          <Input
                            id="brokerUrl"
                            value={newGateway.emqxConfig.brokerUrl}
                            onChange={(e) => setNewGateway({
                              ...newGateway,
                              emqxConfig: { ...newGateway.emqxConfig, brokerUrl: e.target.value }
                            })}
                            placeholder="mqtt://broker.example.com:1883"
                          />
                          <p className="text-sm text-muted-foreground">
                            The MQTT broker URL to connect to.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="subscriptionGroup">Subscription Group</Label>
                          <Input
                            id="subscriptionGroup"
                            value={newGateway.emqxConfig.subscriptionGroup}
                            onChange={(e) => setNewGateway({
                              ...newGateway,
                              emqxConfig: { ...newGateway.emqxConfig, subscriptionGroup: e.target.value }
                            })}
                            placeholder="group-1"
                          />
                          <p className="text-sm text-muted-foreground">
                            Subscription group for shared subscriptions.
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
                        onClick={handleCreateGateway}
                        disabled={createMutation.isPending || !canProceedFromStep(currentStep)}
                      >
                        {createMutation.isPending ? "Creating..." : "Create Gateway"}
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
              ) : gateways.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No gateways configured
                </div>
              ) : (
                <div className="space-y-3">
                  {gateways.map((gateway) => (
                    <Link
                      key={gateway.gatewayId}
                      to="/organizations/$orgId/gateways/$gatewayId"
                      params={{ orgId, gatewayId: gateway.gatewayId }}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Radio className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{gateway.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {gateway.gatewayId}
                          </div>
                          {gateway.config.case === "emqxConfig" && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {gateway.config.value.brokerUrl}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{typeLabel(gateway.type)}</Badge>
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
