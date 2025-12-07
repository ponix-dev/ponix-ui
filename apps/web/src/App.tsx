import { BrowserRouter, Routes, Route, useParams, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import { OrganizationList } from "@/pages/OrganizationList"
import { OrganizationDetail } from "@/pages/OrganizationDetail"
import { GatewayList } from "@/pages/GatewayList"
import { DeviceList } from "@/pages/DeviceList"
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"
import { AppSidebar } from "@/components/layout"
import { RequireAuth } from "@/components/auth"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { organizationClient } from "@/lib/api"

function MainLayout() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

function OrganizationLayout() {
  const { orgId } = useParams<{ orgId: string }>()
  const [orgName, setOrgName] = useState<string>()

  useEffect(() => {
    if (!orgId) return
    organizationClient.getOrganization({ organizationId: orgId })
      .then(res => setOrgName(res.organization?.name))
      .catch(() => {})
  }, [orgId])

  return (
    <div className="flex h-screen">
      <AppSidebar organizationId={orgId} organizationName={orgName} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected routes */}
            <Route
              element={
                <RequireAuth>
                  <MainLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<OrganizationList />} />
              <Route path="/organizations" element={<OrganizationList />} />
            </Route>
            <Route
              path="/organizations/:orgId"
              element={
                <RequireAuth>
                  <OrganizationLayout />
                </RequireAuth>
              }
            >
              <Route index element={<OrganizationDetail />} />
              <Route path="gateways" element={<GatewayList />} />
              <Route path="devices" element={<DeviceList />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
