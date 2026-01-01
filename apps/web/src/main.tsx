import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TransportProvider } from '@connectrpc/connect-query'
import { AuthProvider, useAuth } from '@/lib/auth'
import { transport } from '@/lib/api'
import { queryClient } from '@/lib/query'
import { routeTree } from './routeTree.gen'
import './index.css'

// Create router instance with file-based route tree
const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    queryClient: undefined!,
    transport: undefined!,
  },
  defaultPreload: 'intent',
})

// Type registration for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth, queryClient, transport }} />
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TransportProvider transport={transport}>
          <InnerApp />
          <ReactQueryDevtools initialIsOpen={false} />
        </TransportProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
