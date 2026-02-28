"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginPage } from "@/components/login-page"
import { PortalShell } from "@/components/portal-shell"

function AppContent() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <LoginPage />
  return <PortalShell />
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
