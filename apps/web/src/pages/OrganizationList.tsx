import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery, useMutation } from "@connectrpc/connect-query"
import { Plus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { userOrganizations, createOrganization } from "@buf/ponix_ponix.connectrpc_query-es/organization/v1/organization-OrganizationService_connectquery"
import { useAuth } from "@/lib/auth"

export function OrganizationList() {
  const { user } = useAuth()
  const [newOrgName, setNewOrgName] = useState("")

  // Fetch organizations using TanStack Query
  const {
    data: orgsResponse,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery(userOrganizations, { userId: user?.id ?? "" }, { enabled: !!user })

  const organizations = orgsResponse?.organizations ?? []

  // Create organization mutation
  const createMutation = useMutation(createOrganization, {
    onSuccess: () => {
      setNewOrgName("")
      refetch()
    },
  })

  const error = queryError?.message || createMutation.error?.message || null

  const handleCreateOrg = () => {
    if (!newOrgName.trim()) return
    createMutation.mutate({ name: newOrgName })
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
                <Button onClick={handleCreateOrg} disabled={createMutation.isPending || !newOrgName.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  {createMutation.isPending ? "Creating..." : "Create"}
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
                      to="/organizations/$orgId"
                      params={{ orgId: org.id }}
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
