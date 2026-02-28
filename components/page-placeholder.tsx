"use client"

import {
  Server,
  Network,
  Router,
  Zap,
  Cable,
  Radio,
  Database,
  Signal,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  MapPin,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MenuId, SubMenuId } from "@/lib/menu-config"

// ==========================================
// Home Dashboard (rich, non-placeholder content)
// ==========================================
function HomeDashboard() {
  const stats = [
    { label: "Total OLTs", value: "2", icon: Server, color: "text-sky-400", bg: "bg-sky-500/15" },
    { label: "FDH Cabinets", value: "2", icon: Database, color: "text-emerald-400", bg: "bg-emerald-500/15" },
    { label: "Active ONTs", value: "5/6", icon: Router, color: "text-cyan-400", bg: "bg-cyan-500/15" },
    { label: "Active Alerts", value: "3", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/15" },
  ]

  const recentAlerts = [
    { id: 1, message: "OLT BUFTNCXAH07 - Port PP=006 signal degradation", severity: "warning", time: "12 min ago" },
    { id: 2, message: "FDH-ELM-002 Splitter SPL=006 output low", severity: "warning", time: "45 min ago" },
    { id: 3, message: "ONT-50OAK-1 service pending activation", severity: "info", time: "2 hr ago" },
  ]

  const recentActivity = [
    { id: 1, action: "ONT provisioned", detail: "ONT-456ELM-1 activated for Charlie Davis", time: "1 hr ago", icon: CheckCircle2 },
    { id: 2, action: "Feeder cable added", detail: "Feeder Cable B-07 connected to FDH-ELM-002", time: "3 hr ago", icon: Cable },
    { id: 3, action: "Splitter replaced", detail: "SPL=002 in FDH-MAIN-001 replaced (maintenance)", time: "5 hr ago", icon: Radio },
    { id: 4, action: "New customer order", detail: "Service order #4521 for 200 Main St", time: "6 hr ago", icon: Users },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground text-balance">Operations Dashboard</h2>
        <p className="text-muted-foreground mt-1">Real-time overview of FTTH network operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-xl border-border/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alerts */}
        <Card className="rounded-xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border/30 bg-secondary/20 p-3">
                  <div className={cn(
                    "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                    a.severity === "warning" ? "bg-amber-500" : "bg-sky-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 rounded-md text-[10px]",
                      a.severity === "warning"
                        ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        : "border-sky-500/30 text-sky-400 bg-sky-500/10"
                    )}
                  >
                    {a.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="rounded-xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border/30 bg-secondary/20 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <a.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{a.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network health summary */}
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Network Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {[
              { label: "OLT Uptime", value: "99.97%", good: true },
              { label: "Feeder Loss", value: "0.3 dB", good: true },
              { label: "Splitter Loss", value: "15.2 dB", good: true },
              { label: "ONT Online", value: "83.3%", good: false },
              { label: "Avg Latency", value: "1.2 ms", good: true },
              { label: "Throughput", value: "2.4 Gbps", good: true },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center rounded-lg border border-border/30 bg-secondary/20 p-3 text-center">
                <p className={cn("text-lg font-bold", m.good ? "text-emerald-400" : "text-amber-400")}>{m.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// Home Alerts Sub-page
// ==========================================
function HomeAlerts() {
  const alerts = [
    { id: 1, device: "BUFTNCXAH07", type: "OLT", message: "Port PP=006 signal degradation detected", severity: "warning", time: "2026-02-25 08:14", status: "Open" },
    { id: 2, device: "FDH-ELM-002", type: "FDH", message: "Splitter SPL=006 output power below threshold", severity: "warning", time: "2026-02-25 07:31", status: "Open" },
    { id: 3, device: "ONT-50OAK-1", type: "ONT", message: "Service pending customer activation", severity: "info", time: "2026-02-25 06:02", status: "Pending" },
    { id: 4, device: "FOLYALXAH42", type: "OLT", message: "Card NC=002 fan speed above normal", severity: "warning", time: "2026-02-24 22:45", status: "Acknowledged" },
    { id: 5, device: "FDH-MAIN-001", type: "FDH", message: "Temperature sensor reading 38C", severity: "info", time: "2026-02-24 18:12", status: "Closed" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Alerts</h2>
        <p className="text-muted-foreground mt-1">System and device alerts across all network elements</p>
      </div>
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-b border-border/20 hover:bg-secondary/20">
                    <td className="px-4 py-3 font-mono text-foreground">{a.device}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.type}</td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate">{a.message}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn(
                        "rounded-md text-[10px]",
                        a.severity === "warning" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" : "border-sky-500/30 text-sky-400 bg-sky-500/10"
                      )}>
                        {a.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{a.time}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn(
                        "rounded-md text-[10px]",
                        a.status === "Open" ? "border-destructive/30 text-destructive" :
                        a.status === "Closed" ? "border-emerald-500/30 text-emerald-400" :
                        "border-border/50 text-muted-foreground"
                      )}>
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// Home Activity Log
// ==========================================
function HomeActivityLog() {
  const logs = [
    { time: "08:14", user: "System", action: "Alert generated for BUFTNCXAH07 PP=006" },
    { time: "08:02", user: "Sarah Mitchell", action: "Updated FDH-MAIN-001 splitter configuration" },
    { time: "07:45", user: "James Rivera", action: "Provisioned ONT-456ELM-1 for Charlie Davis" },
    { time: "07:31", user: "System", action: "Alert generated for FDH-ELM-002 SPL=006" },
    { time: "07:12", user: "Mike Thompson", action: "Completed field splice on Dist Cable 003" },
    { time: "06:55", user: "Sarah Mitchell", action: "Created reservation for 75 Oak Rd ports" },
    { time: "06:02", user: "System", action: "ONT-50OAK-1 service order created" },
    { time: "05:30", user: "James Rivera", action: "Added Feeder Cable B-07 to inventory" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Activity Log</h2>
        <p className="text-muted-foreground mt-1">Recent system and user activity</p>
      </div>
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-4">
          <div className="space-y-0">
            {logs.map((l, i) => (
              <div key={i} className="flex items-start gap-4 py-3 border-b border-border/20 last:border-0">
                <span className="text-xs font-mono text-muted-foreground w-12 shrink-0 pt-0.5">{l.time}</span>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{l.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">by {l.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// Generic placeholder for unimplemented pages
// ==========================================
function GenericPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground text-balance">{title}</h2>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      <Card className="rounded-xl border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            This module is under development. The data and functionality for{" "}
            <span className="text-primary">{title}</span> will be available in a future release.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// Specifications pages
// ==========================================
function SpecDevicePage() {
  const specs = [
    { name: "Calix E7-20 OLT", type: "OLT", ports: "16 GPON", status: "Active" },
    { name: "Calix E7-2 OLT", type: "OLT", ports: "8 GPON", status: "Active" },
    { name: "Calix 844G-1", type: "ONT", ports: "4 ETH + 2 Voice", status: "Active" },
    { name: "Calix 844E-1", type: "ONT", ports: "2 ETH + 8 Voice", status: "Active" },
    { name: "Calix 804Mesh", type: "ONT", ports: "2 ETH", status: "Active" },
    { name: "Calix P-Series MDU", type: "ONT-MDU", ports: "24 ETH + 24 Voice", status: "Active" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Device Specifications</h2>
        <p className="text-muted-foreground mt-1">Catalog of approved network device specifications</p>
      </div>
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Specification Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Ports</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((s, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-secondary/20">
                    <td className="px-4 py-3 text-primary font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-foreground">{s.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.ports}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="rounded-md text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// Resources Physical page
// ==========================================
function ResourcesPhysicalPage() {
  const resources = [
    { name: "BUFTNCXAH07", type: "OLT", spec: "Calix E7-20", location: "Central Office", status: "active" },
    { name: "FOLYALXAH42", type: "OLT", spec: "Calix E7-2", location: "Central Office", status: "active" },
    { name: "FDH-MAIN-001", type: "FDH", spec: "144-Port Cabinet", location: "123 Main St", status: "active" },
    { name: "FDH-ELM-002", type: "FDH", spec: "72-Port Cabinet", location: "456 Elm Ave", status: "active" },
    { name: "Dist Cable 001", type: "Cable", spec: "128 Strand", location: "Main St", status: "active" },
    { name: "Dist Cable 002", type: "Cable", spec: "64 Strand", location: "Oak Rd", status: "active" },
    { name: "DT-MAIN-001", type: "Drop Terminal", spec: "8-Port MST", location: "100 Main St", status: "active" },
    { name: "DT-ELM-002", type: "Drop Terminal", spec: "16-Port MST", location: "500 Elm Ave", status: "active" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Physical Resources</h2>
        <p className="text-muted-foreground mt-1">Inventory of all physical network devices and components</p>
      </div>
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Specification</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-secondary/20">
                    <td className="px-4 py-3 font-mono text-foreground">{r.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.type}</td>
                    <td className="px-4 py-3 text-primary">{r.spec}</td>
                    <td className="px-4 py-3 text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{r.location}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="rounded-md text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// Locations Sites page
// ==========================================
function LocationsSitesPage() {
  const sites = [
    { name: "Buffalo Central Office", address: "1 Telecom Plaza, Buffalo, NY", type: "Central Office", devices: 2 },
    { name: "Main St Node", address: "123 Main St, Buffalo, NY", type: "FDH Site", devices: 1 },
    { name: "Elm Ave Node", address: "456 Elm Ave, Buffalo, NY", type: "FDH Site", devices: 1 },
    { name: "Oak Rd Junction", address: "50 Oak Rd, Buffalo, NY", type: "Junction", devices: 2 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Sites</h2>
        <p className="text-muted-foreground mt-1">Network site locations and their equipment</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sites.map((s, i) => (
          <Card key={i} className="rounded-xl border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.address}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="rounded-md text-[10px] border-border/50 text-muted-foreground">{s.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{s.devices} devices</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// Reservations Active page
// ==========================================
function ReservationsActivePage() {
  const reservations = [
    { id: "RSV-001", resource: "DT-MAIN-001 Port 6", customer: "New Install - 106 Main St", date: "2026-02-20", expires: "2026-03-20", status: "Active" },
    { id: "RSV-002", resource: "DT-OAK-002 Port 7-8", customer: "Business Install - 80 Oak Rd", date: "2026-02-22", expires: "2026-03-22", status: "Active" },
    { id: "RSV-003", resource: "FDH-MAIN-001 DP=089", customer: "Upgrade - 150 Main St", date: "2026-02-24", expires: "2026-03-24", status: "Active" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Active Reservations</h2>
        <p className="text-muted-foreground mt-1">Currently reserved network resources</p>
      </div>
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer / Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Reserved</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b border-border/20 hover:bg-secondary/20">
                    <td className="px-4 py-3 font-mono text-primary">{r.id}</td>
                    <td className="px-4 py-3 text-foreground">{r.resource}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.date}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.expires}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="rounded-md text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// Admin Users page
// ==========================================
function AdminUsersPage() {
  const users = [
    { name: "Sarah Mitchell", email: "admin@fibernet.com", role: "Administrator", lastLogin: "2026-02-25 08:00", status: "Active" },
    { name: "James Rivera", email: "engineer@fibernet.com", role: "Network Engineer", lastLogin: "2026-02-25 07:45", status: "Active" },
    { name: "Emily Chen", email: "viewer@fibernet.com", role: "Viewer", lastLogin: "2026-02-24 16:30", status: "Active" },
    { name: "Mike Thompson", email: "tech@fibernet.com", role: "Field Technician", lastLogin: "2026-02-25 06:15", status: "Active" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <p className="text-muted-foreground mt-1">Manage portal users and their access roles</p>
      </div>
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-secondary/20">
                    <td className="px-4 py-3 text-foreground font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-primary font-mono text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.lastLogin}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="rounded-md text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                        {u.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// Main Page Placeholder router
// ==========================================
export function PagePlaceholder({
  menuId,
  subMenuId,
  menuLabel,
  subMenuLabel,
}: {
  menuId: MenuId
  subMenuId: SubMenuId
  menuLabel: string
  subMenuLabel: string
}) {
  // Home sub-pages
  if (menuId === ("home" as MenuId)) {
    if (subMenuId === ("home_dashboard" as SubMenuId)) return <HomeDashboard />
    if (subMenuId === ("home_alerts" as SubMenuId)) return <HomeAlerts />
    if (subMenuId === ("home_activity" as SubMenuId)) return <HomeActivityLog />
  }

  // Specifications
  if (menuId === ("specifications" as MenuId)) {
    if (subMenuId === ("spec_device" as SubMenuId)) return <SpecDevicePage />
    return <GenericPlaceholder title={`${menuLabel} - ${subMenuLabel}`} description={`Manage ${subMenuLabel.toLowerCase()} specifications for network components`} />
  }

  // Resources
  if (menuId === ("resources" as MenuId)) {
    if (subMenuId === ("res_physical" as SubMenuId)) return <ResourcesPhysicalPage />
    return <GenericPlaceholder title={`${menuLabel} - ${subMenuLabel}`} description={`Manage ${subMenuLabel.toLowerCase()} resources in the network`} />
  }

  // Locations
  if (menuId === ("locations" as MenuId)) {
    if (subMenuId === ("loc_sites" as SubMenuId)) return <LocationsSitesPage />
    return <GenericPlaceholder title={`${menuLabel} - ${subMenuLabel}`} description={`${subMenuLabel} location management for network infrastructure`} />
  }

  // Reservations
  if (menuId === ("reservations" as MenuId)) {
    if (subMenuId === ("resv_active" as SubMenuId)) return <ReservationsActivePage />
    return <GenericPlaceholder title={`${menuLabel} - ${subMenuLabel}`} description={`Manage ${subMenuLabel.toLowerCase()} network resource reservations`} />
  }

  // Admin
  if (menuId === ("admin" as MenuId)) {
    if (subMenuId === ("admin_users" as SubMenuId)) return <AdminUsersPage />
    return <GenericPlaceholder title={`${menuLabel} - ${subMenuLabel}`} description={`Administrative ${subMenuLabel.toLowerCase()} management`} />
  }

  // Fallback
  return <GenericPlaceholder title={`${menuLabel} - ${subMenuLabel}`} description={`Content for ${menuLabel} > ${subMenuLabel}`} />
}
