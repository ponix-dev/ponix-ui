import { Link, useLocation } from "react-router-dom"
import { Building2, Radio, Cpu, Home, Moon, Sun, Layers, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { UserMenu } from "./UserMenu"

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

interface AppSidebarProps {
  organizationId?: string
  organizationName?: string
  workspaceId?: string
  workspaceName?: string
}

export function AppSidebar({ organizationId, organizationName, workspaceId, workspaceName }: AppSidebarProps) {
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("light")
    } else {
      // If system, check what system prefers and toggle to opposite
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(systemDark ? "light" : "dark")
    }
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radio className="h-4 w-4" />
          </div>
          <span>Ponix</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Navigation */}
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

        {/* Organization navigation - org selected but no workspace */}
        {organizationId && !workspaceId && (
          <>
            <div className="px-4">
              <div className="text-xs font-medium text-muted-foreground">
                {organizationName || "Organization"}
              </div>
            </div>
            <nav className="mt-2 grid gap-1 px-2">
              <NavItem
                to={`/organizations/${organizationId}`}
                icon={<Building2 className="h-4 w-4" />}
                label="Overview"
                active={location.pathname === `/organizations/${organizationId}`}
              />
              <NavItem
                to={`/organizations/${organizationId}/gateways`}
                icon={<Radio className="h-4 w-4" />}
                label="Gateways"
                active={location.pathname.includes("/gateways")}
              />
              <NavItem
                to={`/organizations/${organizationId}/workspaces`}
                icon={<Layers className="h-4 w-4" />}
                label="Workspaces"
                active={location.pathname.endsWith("/workspaces")}
              />
            </nav>
          </>
        )}

        {/* Workspace navigation - workspace selected */}
        {organizationId && workspaceId && (
          <>
            <div className="px-4">
              <Link
                to={`/organizations/${organizationId}`}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3 w-3" />
                {organizationName || "Organization"}
              </Link>
              <div className="mt-1 text-sm font-medium">
                {workspaceName || "Workspace"}
              </div>
            </div>
            <nav className="mt-2 grid gap-1 px-2">
              <NavItem
                to={`/organizations/${organizationId}/workspaces/${workspaceId}`}
                icon={<Layers className="h-4 w-4" />}
                label="Overview"
                active={location.pathname === `/organizations/${organizationId}/workspaces/${workspaceId}`}
              />
              <NavItem
                to={`/organizations/${organizationId}/workspaces/${workspaceId}/devices`}
                icon={<Cpu className="h-4 w-4" />}
                label="End Devices"
                active={location.pathname.includes("/devices")}
              />
            </nav>
          </>
        )}
      </div>

      {/* User Menu */}
      <div className="border-t p-2">
        <UserMenu />
      </div>
    </div>
  )
}
