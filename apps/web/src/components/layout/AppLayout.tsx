import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"

interface AppLayoutProps {
  organizationId?: string
  organizationName?: string
}

export function AppLayout({ organizationId, organizationName }: AppLayoutProps) {
  return (
    <div className="flex h-screen">
      <AppSidebar organizationId={organizationId} organizationName={organizationName} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
