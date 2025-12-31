import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"
import { OrganizationList } from "@/pages/OrganizationList"
import { GatewayList } from "@/pages/GatewayList"
import { GatewayDetail } from "@/pages/GatewayDetail"
import { DeviceList } from "@/pages/DeviceList"
import { WorkspaceList } from "@/pages/WorkspaceList"
import { EndDeviceDefinitionList } from "@/pages/EndDeviceDefinitionList"
import { EndDeviceDefinitionDetail } from "@/pages/EndDeviceDefinitionDetail"
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"
import { AppSidebar, AppHeader } from "@/components/layout"
import { RequireAuth } from "@/components/auth"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"

// Main layout with header for all authenticated routes
function AppLayout() {
  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

// Layout with sidebar for org-level routes
function SidebarLayout() {
  return (
    <div className="flex flex-1">
      <AppSidebar />
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

            {/* Protected routes - all use AppLayout for unified header */}
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              {/* Org list - no sidebar */}
              <Route path="/" element={<OrganizationList />} />
              <Route path="/organizations" element={<OrganizationList />} />

              {/* All org-related routes use sidebar layout */}
              <Route element={<SidebarLayout />}>
                {/* Org level */}
                <Route path="/organizations/:orgId" element={<WorkspaceList />} />
                <Route path="/organizations/:orgId/workspaces" element={<WorkspaceList />} />
                <Route path="/organizations/:orgId/gateways" element={<GatewayList />} />
                <Route path="/organizations/:orgId/definitions" element={<EndDeviceDefinitionList />} />

                {/* Workspace detail - defaults to devices */}
                <Route path="/organizations/:orgId/workspaces/:workspaceId" element={<DeviceList />} />

                {/* Gateway detail */}
                <Route path="/organizations/:orgId/gateways/:gatewayId" element={<GatewayDetail />} />

                {/* Definition detail */}
                <Route path="/organizations/:orgId/definitions/:definitionId" element={<EndDeviceDefinitionDetail />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
