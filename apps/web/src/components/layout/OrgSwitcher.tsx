import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronsUpDown, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { organizationClient, type Organization } from "@/lib/api"
import { useAuth } from "@/lib/auth"

interface OrgSwitcherProps {
  organizationId?: string
  organizationName?: string
}

export function OrgSwitcher({ organizationId, organizationName }: OrgSwitcherProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchOrganizations = async () => {
    if (!user) return
    try {
      setLoading(true)
      const response = await organizationClient.userOrganizations({ userId: user.id })
      setOrganizations(response.organizations)
    } catch {
      // Silently fail - org switcher is not critical
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && organizations.length === 0) {
      fetchOrganizations()
    }
  }

  const handleSelectOrg = (orgId: string) => {
    navigate(`/organizations/${orgId}`)
    setOpen(false)
  }

  // If no org is selected, don't show the switcher
  if (!organizationId) {
    return null
  }

  // Find current org name from the loaded list, fall back to prop
  const currentOrgName = organizations.find(org => org.id === organizationId)?.name || organizationName || "Organization"

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-2 h-auto py-2"
        >
          <span className="truncate text-sm font-medium">
            {currentOrgName}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {loading ? (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        ) : organizations.length === 0 ? (
          <DropdownMenuItem disabled>No organizations</DropdownMenuItem>
        ) : (
          <>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSelectOrg(org.id)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{org.name}</span>
                {org.id === organizationId && (
                  <Check className="h-4 w-4 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/organizations")}>
              All Organizations
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
