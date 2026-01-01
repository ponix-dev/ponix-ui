import { Link, useLocation, useParams } from "@tanstack/react-router"
import { useQuery } from "@connectrpc/connect-query"
import { Radio, Cpu, Home, Layers, ChevronLeft, FileCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "./OrgSwitcher"
import { getOrganization } from "@buf/ponix_ponix.connectrpc_query-es/organization/v1/organization-OrganizationService_connectquery"
import { getWorkspace } from "@buf/ponix_ponix.connectrpc_query-es/workspace/v1/workspace-WorkspaceService_connectquery"
import { getEndDeviceDefinition } from "@buf/ponix_ponix.connectrpc_query-es/end_device/v1/end_device_definition-EndDeviceDefinitionService_connectquery"
import { getGateway } from "@buf/ponix_ponix.connectrpc_query-es/gateway/v1/gateway-GatewayService_connectquery"

interface NavItemProps {
  to: string
  params?: Record<string, string>
  icon: React.ReactNode
  label: string
  active?: boolean
}

function NavItem({ to, params, icon, label, active }: NavItemProps) {
  return (
    <Link
      to={to as "/"}
      params={params}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  )
}

// Sidebar header with org switcher
function SidebarHeader({ organizationId }: { organizationId?: string }) {
  const { data: orgResponse } = useQuery(
    getOrganization,
    { organizationId: organizationId ?? "" },
    { enabled: !!organizationId }
  )

  if (!organizationId) return null

  return (
    <div className="border-b">
      <div className="flex h-14 items-center px-4">
        <OrgSwitcher organizationId={organizationId} organizationName={orgResponse?.organization?.name} />
      </div>
    </div>
  )
}

// Navigation component that updates based on route
function SidebarNav({
  organizationId,
  workspaceId,
  definitionId,
  gatewayId,
}: {
  organizationId?: string
  workspaceId?: string
  definitionId?: string
  gatewayId?: string
}) {
  const location = useLocation()

  const { data: workspaceResponse } = useQuery(
    getWorkspace,
    { workspaceId: workspaceId ?? "", organizationId: organizationId ?? "" },
    { enabled: !!organizationId && !!workspaceId }
  )
  const workspaceName = workspaceResponse?.workspace?.name

  const { data: definitionResponse } = useQuery(
    getEndDeviceDefinition,
    { id: definitionId ?? "", organizationId: organizationId ?? "" },
    { enabled: !!organizationId && !!definitionId }
  )
  const definitionName = definitionResponse?.endDeviceDefinition?.name

  const { data: gatewayResponse } = useQuery(
    getGateway,
    { gatewayId: gatewayId ?? "", organizationId: organizationId ?? "" },
    { enabled: !!organizationId && !!gatewayId }
  )
  const gatewayName = gatewayResponse?.gateway?.name

  return (
    <div className="flex-1 overflow-auto py-4">
      {/* Main navigation - no org selected */}
      {!organizationId && (
        <nav className="grid gap-1 px-2">
          <NavItem
            to="/organizations"
            icon={<Home className="h-4 w-4" />}
            label="Organizations"
            active={location.pathname === "/" || location.pathname === "/organizations"}
          />
        </nav>
      )}

      {/* Organization navigation - org selected but no workspace, definition, or gateway */}
      {organizationId && !workspaceId && !definitionId && !gatewayId && (
        <nav className="grid gap-1 px-2">
          <NavItem
            to={`/organizations/${organizationId}`}
            icon={<Layers className="h-4 w-4" />}
            label="Workspaces"
            active={location.pathname === `/organizations/${organizationId}` || location.pathname.endsWith("/workspaces")}
          />
          <NavItem
            to={`/organizations/${organizationId}/gateways`}
            icon={<Radio className="h-4 w-4" />}
            label="Gateways"
            active={location.pathname.includes("/gateways")}
          />
          <NavItem
            to={`/organizations/${organizationId}/definitions`}
            icon={<FileCode className="h-4 w-4" />}
            label="Definitions"
            active={location.pathname.includes("/definitions")}
          />
        </nav>
      )}

      {/* Workspace navigation - workspace selected */}
      {organizationId && workspaceId && (
        <>
          <div className="px-4">
            <Link
              // @ts-expect-error - TanStack Router expects typed routes
              to={`/organizations/${organizationId}/workspaces`}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3 w-3" />
              Workspaces
            </Link>
            <div className="mt-1 text-sm font-medium">
              {workspaceName || "Workspace"}
            </div>
          </div>
          <nav className="mt-2 grid gap-1 px-2">
            <NavItem
              to={`/organizations/${organizationId}/workspaces/${workspaceId}`}
              icon={<Cpu className="h-4 w-4" />}
              label="End Devices"
              active
            />
          </nav>
        </>
      )}

      {/* Definition navigation - definition selected */}
      {organizationId && definitionId && (
        <>
          <div className="px-4">
            <Link
              // @ts-expect-error - TanStack Router expects typed routes
              to={`/organizations/${organizationId}/definitions`}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3 w-3" />
              Definitions
            </Link>
            <div className="mt-1 text-sm font-medium">
              {definitionName || "Definition"}
            </div>
          </div>
          <nav className="mt-2 grid gap-1 px-2">
            <NavItem
              to={`/organizations/${organizationId}/definitions/${definitionId}`}
              icon={<FileCode className="h-4 w-4" />}
              label="Overview"
              active={location.pathname === `/organizations/${organizationId}/definitions/${definitionId}`}
            />
          </nav>
        </>
      )}

      {/* Gateway navigation - gateway selected */}
      {organizationId && gatewayId && (
        <>
          <div className="px-4">
            <Link
              // @ts-expect-error - TanStack Router expects typed routes
              to={`/organizations/${organizationId}/gateways`}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3 w-3" />
              Gateways
            </Link>
            <div className="mt-1 text-sm font-medium">
              {gatewayName || "Gateway"}
            </div>
          </div>
          <nav className="mt-2 grid gap-1 px-2">
            <NavItem
              to={`/organizations/${organizationId}/gateways/${gatewayId}`}
              icon={<Radio className="h-4 w-4" />}
              label="Overview"
              active={location.pathname === `/organizations/${organizationId}/gateways/${gatewayId}`}
            />
          </nav>
        </>
      )}
    </div>
  )
}

export function AppSidebar() {
  const params = useParams({ strict: false })
  const { orgId, workspaceId, definitionId, gatewayId } = params as {
    orgId?: string
    workspaceId?: string
    definitionId?: string
    gatewayId?: string
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <SidebarHeader organizationId={orgId} />
      <SidebarNav
        organizationId={orgId}
        workspaceId={workspaceId}
        definitionId={definitionId}
        gatewayId={gatewayId}
      />
    </div>
  )
}
