import { Link, useLocation, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { Radio, Cpu, Home, Layers, ChevronLeft, FileCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "./OrgSwitcher"
import {
  organizationClient,
  workspaceClient,
  endDeviceDefinitionClient,
  gatewayClient,
} from "@/lib/api"

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  active?: boolean
}

function NavItem({ to, icon, label, active }: NavItemProps) {
  return (
    <Link
      to={to}
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
  const [orgName, setOrgName] = useState<string>()

  useEffect(() => {
    if (!organizationId) {
      setOrgName(undefined)
      return
    }
    organizationClient.getOrganization({ organizationId })
      .then(res => setOrgName(res.organization?.name))
      .catch(() => {})
  }, [organizationId])

  if (!organizationId) return null

  return (
    <div className="border-b">
      <div className="flex h-14 items-center px-4">
        <OrgSwitcher organizationId={organizationId} organizationName={orgName} />
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
  const [workspaceName, setWorkspaceName] = useState<string>()
  const [definitionName, setDefinitionName] = useState<string>()
  const [gatewayName, setGatewayName] = useState<string>()

  useEffect(() => {
    if (!organizationId || !workspaceId) {
      setWorkspaceName(undefined)
      return
    }
    workspaceClient.getWorkspace({ workspaceId, organizationId })
      .then(res => setWorkspaceName(res.workspace?.name))
      .catch(() => {})
  }, [organizationId, workspaceId])

  useEffect(() => {
    if (!organizationId || !definitionId) {
      setDefinitionName(undefined)
      return
    }
    endDeviceDefinitionClient.getEndDeviceDefinition({ id: definitionId, organizationId })
      .then(res => setDefinitionName(res.endDeviceDefinition?.name))
      .catch(() => {})
  }, [organizationId, definitionId])

  useEffect(() => {
    if (!organizationId || !gatewayId) {
      setGatewayName(undefined)
      return
    }
    gatewayClient.getGateway({ gatewayId, organizationId })
      .then(res => setGatewayName(res.gateway?.name))
      .catch(() => {})
  }, [organizationId, gatewayId])

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
  const { orgId, workspaceId, definitionId, gatewayId } = useParams<{
    orgId: string
    workspaceId: string
    definitionId: string
    gatewayId: string
  }>()

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
