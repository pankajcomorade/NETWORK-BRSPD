"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { UserRole, ROLE_LABELS } from "@/lib/menu-config"

// ==========================================
// Auth types
// ==========================================
export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  provider: "credentials" | "microsoft_sso"
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  loginWithMicrosoft: () => Promise<boolean>
  logout: () => void
  getRoleLabel: () => string
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ==========================================
// Sample users for demonstration
// ==========================================
const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  "admin@fibernet.com": {
    password: "admin123",
    user: {
      id: "u-001",
      name: "Sarah Mitchell",
      email: "admin@fibernet.com",
      role: UserRole.ADMIN,
      provider: "credentials",
    },
  },
  "engineer@fibernet.com": {
    password: "eng123",
    user: {
      id: "u-002",
      name: "James Rivera",
      email: "engineer@fibernet.com",
      role: UserRole.ENGINEER,
      provider: "credentials",
    },
  },
  "viewer@fibernet.com": {
    password: "view123",
    user: {
      id: "u-003",
      name: "Emily Chen",
      email: "viewer@fibernet.com",
      role: UserRole.VIEWER,
      provider: "credentials",
    },
  },
  "tech@fibernet.com": {
    password: "tech123",
    user: {
      id: "u-004",
      name: "Mike Thompson",
      email: "tech@fibernet.com",
      role: UserRole.FIELD_TECH,
      provider: "credentials",
    },
  },
}

// ==========================================
// Provider
// ==========================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800))
    const entry = DEMO_USERS[email.toLowerCase()]
    if (entry && entry.password === password) {
      setUser(entry.user)
      setIsLoading(false)
      return true
    }
    setIsLoading(false)
    return false
  }, [])

  const loginWithMicrosoft = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    // Simulate Microsoft SSO redirect flow
    await new Promise((r) => setTimeout(r, 1200))
    setUser({
      id: "u-sso-001",
      name: "Azure AD User",
      email: "user@company.onmicrosoft.com",
      role: UserRole.ENGINEER,
      provider: "microsoft_sso",
    })
    setIsLoading(false)
    return true
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const getRoleLabel = useCallback(() => {
    if (!user) return ""
    return ROLE_LABELS[user.role]
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithMicrosoft,
        logout,
        getRoleLabel,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
