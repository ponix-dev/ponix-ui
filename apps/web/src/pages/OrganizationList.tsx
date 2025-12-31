import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  organizationClient,
  type Organization,
} from "@/lib/api"
import { useAuth } from "@/lib/auth"

export function OrganizationList() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // For creating new orgs
  const [newOrgName, setNewOrgName] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchOrganizations = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const response = await organizationClient.userOrganizations({ userId: user.id })
      setOrganizations(response.organizations)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch organizations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [user])

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return

    try {
      setCreating(true)
      await organizationClient.createOrganization({ name: newOrgName })
      setNewOrgName("")
      fetchOrganizations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Create new organization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create Organization</CardTitle>
              <CardDescription>
                Add a new organization to manage your IoT devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateOrg()}
                  placeholder="Organization name"
                  className="max-w-sm"
                />
                <Button onClick={handleCreateOrg} disabled={creating || !newOrgName.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Organization list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Organizations</CardTitle>
              <CardDescription>
                Click an organization to manage its gateways and devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading organizations...
                </div>
              ) : organizations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No organizations yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {organizations.map((org) => (
                    <Link
                      key={org.id}
                      to={`/organizations/${org.id}`}
                      className="flex items-center rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {org.id}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
