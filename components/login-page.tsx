"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

export function LoginPage() {
  const { login, loginWithMicrosoft, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [ssoLoading, setSsoLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Please enter email and password")
      return
    }
    const ok = await login(email, password)
    if (!ok) setError("Invalid credentials. Try admin@fibernet.com / admin123")
  }

  const handleMicrosoftSSO = async () => {
    setSsoLoading(true)
    setError("")
    await loginWithMicrosoft()
    setSsoLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background grid pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow */}
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* Logo / Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 mb-4">
            <Activity className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance">FiberNet Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            FTTH Network Operations Management
          </p>
        </div>

        <Card className="rounded-2xl border-border/50 shadow-2xl shadow-primary/5">
          <CardContent className="p-6">
            {/* Microsoft SSO */}
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl border-border/60 bg-secondary/30 text-foreground hover:bg-secondary/60"
              onClick={handleMicrosoftSSO}
              disabled={isLoading || ssoLoading}
            >
              {ssoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
              )}
              Sign in with Microsoft
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or sign in with credentials</span>
              </div>
            </div>

            {/* Credentials form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fibernet.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl bg-secondary/30 border-border/50"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl bg-secondary/30 border-border/50 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading && !ssoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo credentials hint */}
        <div className="mt-6 rounded-xl border border-border/30 bg-card/50 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Demo Credentials</p>
          <div className="space-y-1 text-xs text-muted-foreground font-mono">
            <p><span className="text-primary">admin@fibernet.com</span> / admin123 (Admin)</p>
            <p><span className="text-primary">engineer@fibernet.com</span> / eng123 (Engineer)</p>
            <p><span className="text-primary">viewer@fibernet.com</span> / view123 (Viewer)</p>
            <p><span className="text-primary">tech@fibernet.com</span> / tech123 (Field Tech)</p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          FiberNet v2.0 - Network Operations Portal
        </p>
      </motion.div>
    </div>
  )
}
