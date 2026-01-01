import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TransportProvider } from '@connectrpc/connect-query'
import { AuthProvider, useAuth } from '@/lib/auth'
import { transport } from '@/lib/api'
import { queryClient } from '@/lib/query'
import { router } from '@/router'
import './index.css'

function InnerApp() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
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
