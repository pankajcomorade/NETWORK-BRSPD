"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  Search,
  Server,
  Network,
  Cable,
  Radio,
  CircuitBoard,
  Wifi,
  Router,
  Home,
  MapPin,
  Zap,
  Box,
  HardDrive,
  Layers,
  LayoutGrid,
  Database,
  Signal,
  ArrowRight,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  type NodeType,
  type BreadcrumbItem,
  type DeviceStatus,
  sampleOLTs,
  sampleFDHs,
  sampleDistributionCables,
  sampleDropTerminals,
  sampleONTs,
} from "@/lib/network-data"
import type { SubMenuId } from "@/lib/menu-config"
import { VisualHierarchyExplorer } from "./visual-hierarchy-explorer"
import { PhysicalDeviceGUI } from "./physical-device-gui"

// ==========================================
// Shared sub-components
// ==========================================
function StatusDot({ status }: { status: DeviceStatus }) {
  const colorMap: Record<DeviceStatus, string> = {
    active: "bg-emerald-500 shadow-emerald-500/50",
    inactive: "bg-zinc-500 shadow-zinc-500/30",
    warning: "bg-amber-500 shadow-amber-500/50",
    maintenance: "bg-sky-500 shadow-sky-500/50",
  }
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full shadow-[0_0_6px]", colorMap[status])} aria-label={status} />
}

function StatusBadge({ status }: { status: DeviceStatus }) {
  const map: Record<DeviceStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    inactive: { label: "Inactive", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
    warning: { label: "Warning", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    maintenance: { label: "Maintenance", className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  }
  const s = map[status]
  return <Badge variant="outline" className={cn("rounded-md text-xs font-medium", s.className)}>{s.label}</Badge>
}

function getNodeIcon(type: NodeType, className?: string) {
  const c = className || "h-4 w-4"
  const icons: Record<NodeType, React.ReactNode> = {
    overview: <LayoutGrid className={c} />,
    olt: <Server className={c} />,
    rack: <HardDrive className={c} />,
    shelf: <Layers className={c} />,
    slot: <Box className={c} />,
    card: <CircuitBoard className={c} />,
    port: <Zap className={c} />,
    "feeder-cable": <Cable className={c} />,
    fdh: <Database className={c} />,
    splitter: <Radio className={c} />,
    "distribution-cable": <Network className={c} />,
    "drop-terminal": <Signal className={c} />,
    ont: <Router className={c} />,
  }
  return icons[type]
}

function NetworkBreadcrumb({ items, onNavigate }: { items: BreadcrumbItem[]; onNavigate: (index: number) => void }) {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-sm" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <div key={`${item.nodeType}-${item.nodeId}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <button
            onClick={() => onNavigate(i)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
              i === items.length - 1 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {getNodeIcon(item.nodeType, "h-3.5 w-3.5")}
            <span className="truncate max-w-[120px]">{item.label}</span>
          </button>
        </div>
      ))}
    </nav>
  )
}

// ==========================================
// Hardware Image
// ==========================================
function HardwareImage({ type, className }: { type: NodeType; className?: string }) {
  const renderImage = () => {
    switch (type) {
      case "olt":
        return (
          <svg viewBox="0 0 400 200" className={cn("w-full", className)}>
            <defs><linearGradient id="oltBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2a2a3a" /><stop offset="100%" stopColor="#1a1a2a" /></linearGradient></defs>
            <rect x="10" y="20" width="380" height="160" rx="8" fill="url(#oltBody)" stroke="#3b4252" strokeWidth="1.5" />
            <rect x="25" y="35" width="60" height="10" rx="2" fill="#0ea5e9" opacity="0.8" />
            <text x="95" y="44" fill="#94a3b8" fontSize="10" fontFamily="monospace">CALIX E7-20 OLT</text>
            {Array.from({ length: 8 }, (_, i) => (
              <g key={`p1-${i}`}><rect x={30 + i * 42} y="65" width="32" height="22" rx="2" fill="#0c1425" stroke="#334155" strokeWidth="0.8" /><rect x={34 + i * 42} y="69" width="24" height="14" rx="1" fill={i < 5 ? "#22c55e" : "#334155"} opacity={i < 5 ? 0.6 : 0.3} /></g>
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <g key={`p2-${i}`}><rect x={30 + i * 42} y="100" width="32" height="22" rx="2" fill="#0c1425" stroke="#334155" strokeWidth="0.8" /><rect x={34 + i * 42} y="104" width="24" height="14" rx="1" fill={i < 3 ? "#22c55e" : "#334155"} opacity={i < 3 ? 0.6 : 0.3} /></g>
            ))}
            {Array.from({ length: 4 }, (_, i) => (<circle key={`led-${i}`} cx={30 + i * 15} cy="145" r="4" fill={i === 0 ? "#22c55e" : i === 1 ? "#0ea5e9" : "#334155"} />))}
            <text x="100" y="148" fill="#64748b" fontSize="8" fontFamily="monospace">PWR | SYS | ALM | ACT</text>
            <text x="30" y="170" fill="#475569" fontSize="8" fontFamily="monospace">S/N: CAX720-2021-07B</text>
          </svg>
        )
      case "fdh":
        return (
          <svg viewBox="0 0 400 240" className={cn("w-full", className)}>
            <defs><linearGradient id="fdhBody2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e293b" /><stop offset="100%" stopColor="#0f172a" /></linearGradient></defs>
            <rect x="20" y="10" width="360" height="220" rx="6" fill="url(#fdhBody2)" stroke="#334155" strokeWidth="1.5" />
            <rect x="35" y="25" width="150" height="18" rx="3" fill="#0ea5e9" opacity="0.15" />
            <text x="42" y="37" fill="#0ea5e9" fontSize="10" fontFamily="monospace">FEEDER PANEL</text>
            {Array.from({ length: 4 }, (_, i) => (<g key={`fp-${i}`}><rect x={35 + i * 40} y="50" width="30" height="20" rx="2" fill="#0c1425" stroke={i < 2 ? "#0ea5e9" : "#334155"} strokeWidth="1" /><text x={44 + i * 40} y="64" fill={i < 2 ? "#0ea5e9" : "#475569"} fontSize="7" fontFamily="monospace" textAnchor="middle">FP{i + 1}</text></g>))}
            <text x="35" y="92" fill="#a78bfa" fontSize="9" fontFamily="monospace">SPLITTERS (1:32)</text>
            {Array.from({ length: 4 }, (_, i) => (<g key={`spl-${i}`}><polygon points={`${35 + i * 88},100 ${105 + i * 88},110 ${35 + i * 88},120`} fill="#a78bfa" opacity="0.15" stroke="#a78bfa" strokeWidth="0.8" /><text x={55 + i * 88} y="113" fill="#a78bfa" fontSize="7" fontFamily="monospace">1:32</text></g>))}
            <rect x="35" y="130" width="180" height="18" rx="3" fill="#22c55e" opacity="0.15" />
            <text x="42" y="142" fill="#22c55e" fontSize="10" fontFamily="monospace">DISTRIBUTION PANEL</text>
            {Array.from({ length: 2 }, (_, row) => Array.from({ length: 16 }, (_, col) => (<rect key={`dp-${row}-${col}`} x={35 + col * 21} y={155 + row * 22} width="16" height="16" rx="1.5" fill="#0c1425" stroke={col + row * 16 < 20 ? "#22c55e" : "#1e293b"} strokeWidth="0.8" opacity={col + row * 16 < 20 ? 0.8 : 0.4} />)))}
            <text x="35" y="210" fill="#475569" fontSize="8" fontFamily="monospace">FDH-MAIN-001 | 144 Ports Total</text>
          </svg>
        )
      case "splitter":
        return (
          <svg viewBox="0 0 400 180" className={cn("w-full", className)}>
            <rect x="10" y="10" width="380" height="160" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="30" y="35" fill="#a78bfa" fontSize="11" fontFamily="monospace">Optical Splitter Module</text>
            <line x1="30" y1="70" x2="120" y2="90" stroke="#0ea5e9" strokeWidth="2.5" />
            <circle cx="30" cy="70" r="6" fill="#0ea5e9" opacity="0.4" /><circle cx="30" cy="70" r="3" fill="#0ea5e9" />
            <text x="20" y="60" fill="#0ea5e9" fontSize="8" fontFamily="monospace">IN</text>
            <polygon points="120,60 200,30 200,150 120,120" fill="#a78bfa" opacity="0.1" stroke="#a78bfa" strokeWidth="1" />
            <text x="140" y="95" fill="#a78bfa" fontSize="10" fontFamily="monospace">1:32</text>
            {Array.from({ length: 8 }, (_, i) => (<g key={`out-${i}`}><line x1="200" y1={35 + i * 17} x2="350" y2={35 + i * 17} stroke="#22c55e" strokeWidth="1.5" opacity={0.4 + (i < 5 ? 0.4 : 0)} /><circle cx="350" cy={35 + i * 17} r="3" fill={i < 5 ? "#22c55e" : "#334155"} /></g>))}
            <text x="30" y="155" fill="#475569" fontSize="8" fontFamily="monospace">32 Output Legs</text>
          </svg>
        )
      case "drop-terminal":
        return (
          <svg viewBox="0 0 400 180" className={cn("w-full", className)}>
            <defs><linearGradient id="dtBody2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e293b" /><stop offset="100%" stopColor="#0f172a" /></linearGradient></defs>
            <rect x="20" y="10" width="360" height="160" rx="6" fill="url(#dtBody2)" stroke="#334155" strokeWidth="1.5" />
            <text x="35" y="35" fill="#f59e0b" fontSize="11" fontFamily="monospace">Drop Terminal</text>
            <rect x="35" y="48" width="80" height="12" rx="2" fill="#0ea5e9" opacity="0.2" stroke="#0ea5e9" strokeWidth="0.8" />
            <text x="42" y="57" fill="#0ea5e9" fontSize="7" fontFamily="monospace">DIST IN</text>
            {Array.from({ length: 8 }, (_, i) => (<g key={`dtp-${i}`}><rect x={35 + i * 42} y="75" width="32" height="32" rx="3" fill="#0c1425" stroke={i < 5 ? "#22c55e" : "#334155"} strokeWidth="1" /><circle cx={51 + i * 42} cy="87" r="6" fill={i < 5 ? "#22c55e" : "#1e293b"} opacity={i < 5 ? 0.5 : 0.3} /><text x={51 + i * 42} y="103" fill={i < 5 ? "#22c55e" : "#475569"} fontSize="7" fontFamily="monospace" textAnchor="middle">{i + 1}</text></g>))}
            <text x="35" y="130" fill="#475569" fontSize="8" fontFamily="monospace">8-Port MST / Access Point</text>
            <text x="35" y="155" fill="#475569" fontSize="8" fontFamily="monospace">Location: Pole #127-A, Main St</text>
          </svg>
        )
      case "ont":
        return (
          <svg viewBox="0 0 400 180" className={cn("w-full", className)}>
            <defs><linearGradient id="ontBody2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a2332" /><stop offset="100%" stopColor="#111827" /></linearGradient></defs>
            <rect x="20" y="15" width="360" height="150" rx="8" fill="url(#ontBody2)" stroke="#334155" strokeWidth="1.5" />
            <text x="35" y="38" fill="#0ea5e9" fontSize="10" fontFamily="monospace" fontWeight="bold">CALIX</text>
            <text x="80" y="38" fill="#64748b" fontSize="10" fontFamily="monospace">844G-1</text>
            <circle cx="35" cy="55" r="4" fill="#22c55e" /><text x="45" y="58" fill="#64748b" fontSize="7" fontFamily="monospace">PWR</text>
            <circle cx="80" cy="55" r="4" fill="#0ea5e9" /><text x="90" y="58" fill="#64748b" fontSize="7" fontFamily="monospace">PON</text>
            <circle cx="125" cy="55" r="4" fill="#22c55e" /><text x="135" y="58" fill="#64748b" fontSize="7" fontFamily="monospace">NET</text>
            <circle cx="170" cy="55" r="4" fill="#334155" /><text x="180" y="58" fill="#64748b" fontSize="7" fontFamily="monospace">ALM</text>
            <text x="35" y="82" fill="#22c55e" fontSize="8" fontFamily="monospace">ETHERNET</text>
            {Array.from({ length: 4 }, (_, i) => (<g key={`eth-${i}`}><rect x={35 + i * 45} y="88" width="35" height="25" rx="2" fill="#0c1425" stroke={i < 2 ? "#22c55e" : "#334155"} strokeWidth="1" /><text x={52 + i * 45} y="105" fill={i < 2 ? "#22c55e" : "#475569"} fontSize="7" fontFamily="monospace" textAnchor="middle">E{i + 1}</text></g>))}
            <text x="240" y="82" fill="#f59e0b" fontSize="8" fontFamily="monospace">VOICE</text>
            {Array.from({ length: 2 }, (_, i) => (<g key={`voice-${i}`}><rect x={240 + i * 45} y="88" width="35" height="25" rx="2" fill="#0c1425" stroke="#f59e0b" strokeWidth="0.8" opacity="0.6" /><text x={257 + i * 45} y="105" fill="#f59e0b" fontSize="7" fontFamily="monospace" textAnchor="middle">V{i + 1}</text></g>))}
            <text x="35" y="135" fill="#0ea5e9" fontSize="8" fontFamily="monospace">FIBER IN</text>
            <circle cx="90" cy="132" r="6" fill="#0ea5e9" opacity="0.4" /><circle cx="90" cy="132" r="3" fill="#0ea5e9" />
            <text x="35" y="155" fill="#475569" fontSize="7" fontFamily="monospace">S/N: CXNK00A1B2C3</text>
          </svg>
        )
      case "rack":
        return (
          <svg viewBox="0 0 300 300" className={cn("w-full", className)}>
            <rect x="30" y="10" width="240" height="280" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            <rect x="40" y="10" width="8" height="280" fill="#1e293b" /><rect x="252" y="10" width="8" height="280" fill="#1e293b" />
            {Array.from({ length: 5 }, (_, i) => (<g key={`unit-${i}`}><rect x="55" y={25 + i * 52} width="190" height="42" rx="3" fill={i < 3 ? "#1a2332" : "#111827"} stroke={i < 3 ? "#334155" : "#1e293b"} strokeWidth="1" />{i < 3 && (<><circle cx="70" cy={46 + i * 52} r="3" fill="#22c55e" /><text x="82" y={49 + i * 52} fill="#94a3b8" fontSize="8" fontFamily="monospace">SLOT {i + 1}</text>{Array.from({ length: 6 }, (_, j) => (<rect key={`port-${i}-${j}`} x={140 + j * 17} y={35 + i * 52} width="12" height="22" rx="1" fill="#0c1425" stroke={j < 4 ? "#22c55e" : "#1e293b"} strokeWidth="0.5" />))}</>)}{i >= 3 && (<text x="120" y={49 + i * 52} fill="#334155" fontSize="8" fontFamily="monospace" textAnchor="middle">EMPTY</text>)}</g>))}
            <text x="150" y="295" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">Rack RK=001</text>
          </svg>
        )
      case "card":
        return (
          <svg viewBox="0 0 400 140" className={cn("w-full", className)}>
            <rect x="10" y="10" width="380" height="120" rx="4" fill="#1a2332" stroke="#334155" strokeWidth="1" />
            <text x="25" y="30" fill="#0ea5e9" fontSize="9" fontFamily="monospace">GPON LINE CARD - NC=001</text>
            <circle cx="370" cy="25" r="4" fill="#22c55e" />
            {Array.from({ length: 8 }, (_, i) => (<g key={`cp-${i}`}><rect x={25 + i * 45} y="45" width="35" height="55" rx="2" fill="#0c1425" stroke={i < 5 ? "#22c55e" : "#334155"} strokeWidth="1" /><rect x={30 + i * 45} y="50" width="25" height="10" rx="1" fill={i < 5 ? "#22c55e" : "#1e293b"} opacity="0.4" /><text x={42 + i * 45} y="84" fill={i < 5 ? "#94a3b8" : "#334155"} fontSize="8" fontFamily="monospace" textAnchor="middle">PP={String(i + 1).padStart(3, "0")}</text>{i < 5 && <circle cx={42 + i * 45} cy="94" r="2" fill="#22c55e" opacity="0.8" />}</g>))}
            <text x="25" y="125" fill="#475569" fontSize="7" fontFamily="monospace">8x GPON Ports | 2.5Gbps Down / 1.25Gbps Up</text>
          </svg>
        )
      case "feeder-cable":
        return (
          <svg viewBox="0 0 400 120" className={cn("w-full", className)}>
            <rect x="10" y="10" width="380" height="100" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="25" y="30" fill="#0ea5e9" fontSize="9" fontFamily="monospace">FEEDER CABLE - FIBER OPTIC</text>
            {Array.from({ length: 6 }, (_, i) => (<line key={`strand-${i}`} x1="25" y1={45 + i * 9} x2="375" y2={45 + i * 9} stroke="#0ea5e9" strokeWidth="2" opacity={0.2 + i * 0.12} />))}
            <text x="25" y="105" fill="#475569" fontSize="8" fontFamily="monospace">48 Glass Fiber Strands | Single Mode</text>
          </svg>
        )
      case "distribution-cable":
        return (
          <svg viewBox="0 0 400 120" className={cn("w-full", className)}>
            <rect x="10" y="10" width="380" height="100" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="25" y="30" fill="#22c55e" fontSize="9" fontFamily="monospace">DISTRIBUTION CABLE</text>
            {Array.from({ length: 8 }, (_, i) => (<line key={`strand-${i}`} x1="25" y1={42 + i * 7} x2="375" y2={42 + i * 7} stroke="#22c55e" strokeWidth="1.5" opacity={0.15 + i * 0.08} />))}
            <text x="25" y="105" fill="#475569" fontSize="8" fontFamily="monospace">128 Strands | Armored Outdoor</text>
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 400 120" className={cn("w-full", className)}>
            <rect x="10" y="10" width="380" height="100" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="200" y="65" fill="#475569" fontSize="12" fontFamily="monospace" textAnchor="middle">Network Component</text>
          </svg>
        )
    }
  }
  return <div className="rounded-xl border border-border/50 bg-card/50 p-4 overflow-hidden">{renderImage()}</div>
}

// ==========================================
// TreeNode
// ==========================================
function TreeNode({
  label, nodeType, nodeId, status, isSelected, children, defaultOpen, onSelect, depth = 0,
}: {
  label: string; nodeType: NodeType; nodeId: string; status?: DeviceStatus; isSelected: boolean
  children?: React.ReactNode; defaultOpen?: boolean; onSelect: (type: NodeType, id: string) => void; depth?: number
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false)
  const hasChildren = !!children
  return (
    <div>
      <button
        onClick={() => { onSelect(nodeType, nodeId); if (hasChildren) setIsOpen(!isOpen) }}
        className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors", isSelected ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isOpen && "rotate-90")} /> : <span className="w-3.5" />}
        <span className="shrink-0 text-muted-foreground">{getNodeIcon(nodeType, "h-3.5 w-3.5")}</span>
        {status && <StatusDot status={status} />}
        <span className="truncate">{label}</span>
      </button>
      {hasChildren && isOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
          {children}
        </motion.div>
      )}
    </div>
  )
}

// ==========================================
// Detail helpers
// ==========================================
function DetailRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between py-2 border-b border-border/30 last:border-0", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="rounded-xl border-border/50">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", color)}>{icon}</div>
        <div><p className="text-xs text-muted-foreground">{title}</p><p className="text-xl font-bold text-foreground">{value}</p></div>
      </CardContent>
    </Card>
  )
}

function PortGrid({ ports, onPortClick }: { ports: { id: string; name: string; status: DeviceStatus; connectedTo?: string }[]; onPortClick?: (portId: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
      {ports.map((port) => (
        <TooltipProvider key={port.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onPortClick?.(port.id)} className={cn("flex flex-col items-center justify-center rounded-lg border p-2 text-xs transition-all hover:scale-105", port.status === "active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary")}>
                <Zap className="h-3.5 w-3.5 mb-0.5" /><span className="font-mono text-[10px]">{port.name}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">{port.name}</p><p className="text-muted-foreground">Status: {port.status}</p>
              {port.connectedTo && <p className="text-muted-foreground">Connected: {port.connectedTo}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}

// ==========================================
// Network Topology / Performance placeholders
// ==========================================
function NetworkTopology({ navigate }: { navigate: (type: NodeType, id: string) => void }) {
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-foreground">Network Topology</h2><p className="text-muted-foreground mt-1">Visual representation of the FTTH network path</p></div>
      <Card className="rounded-xl border-border/50 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-center gap-3 py-4">
            {[
              { label: "OLT", icon: <Server className="h-6 w-6" />, color: "text-sky-400 border-sky-500/30 bg-sky-500/10", click: () => navigate("olt", sampleOLTs[0].id) },
              { label: "Feeder Cable", icon: <Cable className="h-6 w-6" />, color: "text-sky-400 border-sky-500/30 bg-sky-500/10", click: () => navigate("feeder-cable", sampleOLTs[0].feederCables[0].id) },
              { label: "FDH", icon: <Database className="h-6 w-6" />, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", click: () => navigate("fdh", sampleFDHs[0].id) },
              { label: "Splitter", icon: <Radio className="h-6 w-6" />, color: "text-violet-400 border-violet-500/30 bg-violet-500/10", click: () => navigate("splitter", sampleFDHs[0].splitters[0].id) },
              { label: "Dist Cable", icon: <Network className="h-6 w-6" />, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", click: () => navigate("distribution-cable", sampleDistributionCables[0].id) },
              { label: "Drop Terminal", icon: <Signal className="h-6 w-6" />, color: "text-amber-400 border-amber-500/30 bg-amber-500/10", click: () => navigate("drop-terminal", sampleDropTerminals[0].id) },
              { label: "ONT", icon: <Router className="h-6 w-6" />, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", click: () => navigate("ont", sampleONTs[0].id) },
              { label: "Customer", icon: <Home className="h-6 w-6" />, color: "text-foreground border-border bg-secondary" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-3">
                <button onClick={item.click} className={cn("flex flex-col items-center gap-2 rounded-xl border px-5 py-4 transition-all hover:scale-105", item.color)}>
                  {item.icon}<span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                </button>
                {i < 7 && <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* OLT feed graph */}
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base text-foreground">OLT to FDH Connections</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sampleOLTs.map((olt) => (
              <div key={olt.id} className="rounded-lg border border-border/30 bg-secondary/20 p-4">
                <button onClick={() => navigate("olt", olt.id)} className="text-sm font-medium text-primary hover:underline">{olt.distinguishedName} ({olt.specification})</button>
                <div className="mt-2 space-y-2 pl-4 border-l-2 border-sky-500/30">
                  {olt.feederCables.map((fc) => {
                    const fdh = sampleFDHs.find((f) => f.id === fc.destinationFdhId)
                    return (
                      <div key={fc.id} className="flex items-center gap-2 text-xs">
                        <Cable className="h-3 w-3 text-sky-400" />
                        <button onClick={() => navigate("feeder-cable", fc.id)} className="text-foreground hover:text-primary">{fc.name} ({fc.strandCount} strands)</button>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {fdh && <button onClick={() => navigate("fdh", fdh.id)} className="text-emerald-400 hover:underline">{fdh.name}</button>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NetworkPerformance() {
  const metrics = [
    { label: "Avg PON Utilization", value: "42%", status: "good" },
    { label: "Peak Bandwidth", value: "2.4 Gbps", status: "good" },
    { label: "Packet Loss", value: "0.001%", status: "good" },
    { label: "Avg Latency", value: "1.2 ms", status: "good" },
    { label: "ONT Online Rate", value: "83.3%", status: "warning" },
    { label: "Splitter Loss", value: "15.2 dB", status: "good" },
  ]
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-foreground">Network Performance</h2><p className="text-muted-foreground mt-1">Real-time performance metrics for the FTTH network</p></div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m) => (
          <Card key={m.label} className="rounded-xl border-border/50">
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <p className={cn("text-xl font-bold", m.status === "good" ? "text-emerald-400" : "text-amber-400")}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// MAIN: NetworkContent
// ==========================================
export function NetworkContent({ subMenu }: { subMenu: SubMenuId }) {
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>("overview")
  const [selectedNodeId, setSelectedNodeId] = useState<string>("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: "Network", nodeType: "overview", nodeId: "overview" },
  ])
  const [treePanelOpen, setTreePanelOpen] = useState(true)

  const navigate = useCallback((nodeType: NodeType, nodeId: string) => {
    setSelectedNodeType(nodeType)
    setSelectedNodeId(nodeId)
    const newCrumbs: BreadcrumbItem[] = [{ label: "Network", nodeType: "overview", nodeId: "overview" }]
    if (nodeType === "overview") { setBreadcrumbs(newCrumbs); return }

    const olt = sampleOLTs.find(
      (o) =>
        o.id === nodeId ||
        o.feederCables.some((fc) => fc.id === nodeId) ||
        o.racks.some((r) =>
          r.id === nodeId ||
          r.shelves.some((s) =>
            s.id === nodeId ||
            s.slots.some(
              (sl) =>
                sl.id === nodeId ||
                sl.card?.id === nodeId ||
                sl.card?.ports.some((p) => p.id === nodeId)
            )
          )
        )
    )
    if (olt) {
      newCrumbs.push({ label: olt.name, nodeType: "olt", nodeId: olt.id })
      if (nodeType !== "olt") {
        const fc = olt.feederCables.find((f) => f.id === nodeId)
        if (fc) newCrumbs.push({ label: fc.name, nodeType: "feeder-cable", nodeId: fc.id })
        for (const rack of olt.racks) {
          if (rack.id === nodeId || rack.shelves.some((s) => s.id === nodeId || s.slots.some((sl) => sl.id === nodeId || sl.card?.id === nodeId))) {
            newCrumbs.push({ label: rack.name, nodeType: "rack", nodeId: rack.id })
            if (nodeType !== "rack") {
              for (const shelf of rack.shelves) {
                if (shelf.id === nodeId || shelf.slots.some((sl) => sl.id === nodeId || sl.card?.id === nodeId)) {
                  newCrumbs.push({ label: shelf.name, nodeType: "shelf", nodeId: shelf.id })
                  if (nodeType !== "shelf") {
                    for (const slot of shelf.slots) {
                      if (slot.id === nodeId || slot.card?.id === nodeId) {
                        newCrumbs.push({ label: slot.name, nodeType: "slot", nodeId: slot.id })
                        if (nodeType === "card" && slot.card) newCrumbs.push({ label: slot.card.name, nodeType: "card", nodeId: slot.card.id })
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    const fdh = sampleFDHs.find((f) => f.id === nodeId || f.splitters.some((s) => s.id === nodeId))
    if (fdh && nodeType !== "olt") {
      newCrumbs.push({ label: fdh.name, nodeType: "fdh", nodeId: fdh.id })
      if (nodeType === "splitter") { const spl = fdh.splitters.find((s) => s.id === nodeId); if (spl) newCrumbs.push({ label: spl.name, nodeType: "splitter", nodeId: spl.id }) }
    }
    const dc = sampleDistributionCables.find((d) => d.id === nodeId)
    if (dc) newCrumbs.push({ label: dc.name, nodeType: "distribution-cable", nodeId: dc.id })
    const dt = sampleDropTerminals.find((d) => d.id === nodeId)
    if (dt) {
      const parentDc = sampleDistributionCables.find((d) => d.id === dt.distributionCableId)
      if (parentDc) newCrumbs.push({ label: parentDc.name, nodeType: "distribution-cable", nodeId: parentDc.id })
      newCrumbs.push({ label: dt.name, nodeType: "drop-terminal", nodeId: dt.id })
    }
    const ont = sampleONTs.find((o) => o.id === nodeId)
    if (ont) {
      const parentDt = sampleDropTerminals.find((d) => d.id === ont.dropTerminalId)
      if (parentDt) newCrumbs.push({ label: parentDt.name, nodeType: "drop-terminal", nodeId: parentDt.id })
      newCrumbs.push({ label: ont.name, nodeType: "ont", nodeId: ont.id })
    }
    setBreadcrumbs(newCrumbs)
  }, [])

  // Render for Topology / Performance / Physical Device submenus
  if (subMenu === ("net_topology" as SubMenuId)) return <NetworkTopology navigate={navigate} />
  if (subMenu === ("net_performance" as SubMenuId)) return <NetworkPerformance />
  if (subMenu === ("net_physical_device" as SubMenuId)) return <PhysicalDeviceGUI olt={sampleOLTs[0]} />
  if (subMenu === ("net_hierarchy" as SubMenuId)) return <VisualHierarchyExplorer selectedOltId={sampleOLTs[0]?.id} />

  // ---- Overview submenu: full tree + detail layout ----
  const renderDetailPanel = () => {
    switch (selectedNodeType) {
      case "overview": return renderOverview()
      case "olt": return renderOLTDetail()
      case "rack": return renderRackDetail()
      case "shelf": return renderShelfDetail()
      case "slot": return renderSlotDetail()
      case "card": return renderCardDetail()
      case "feeder-cable": return renderFeederCableDetail()
      case "fdh": return renderFDHDetail()
      case "splitter": return renderSplitterDetail()
      case "distribution-cable": return renderDistCableDetail()
      case "drop-terminal": return renderDropTerminalDetail()
      case "ont": return renderONTDetail()
      default: return renderOverview()
    }
  }

  // ---- All detail render functions ----
  const renderOverview = () => {
    const totalActivePorts = sampleOLTs.reduce((acc, o) => acc + o.racks.reduce((a, r) => a + r.shelves.reduce((b, s) => b + s.slots.reduce((c, sl) => c + (sl.card?.ports.filter((p) => p.status === "active").length || 0), 0), 0), 0), 0)
    const totalONTs = sampleONTs.length
    const workingONTs = sampleONTs.filter((o) => o.serviceStatus === "working").length
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold text-foreground text-balance">FTTH Network Overview</h2><p className="text-muted-foreground mt-1">Fiber to the Home infrastructure management dashboard</p></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="OLT Devices" value={sampleOLTs.length} icon={<Server className="h-5 w-5 text-sky-400" />} color="bg-sky-500/15" />
          <StatCard title="FDH Cabinets" value={sampleFDHs.length} icon={<Database className="h-5 w-5 text-emerald-400" />} color="bg-emerald-500/15" />
          <StatCard title="Active PON Ports" value={totalActivePorts} icon={<Zap className="h-5 w-5 text-amber-400" />} color="bg-amber-500/15" />
          <StatCard title="Active ONTs" value={`${workingONTs}/${totalONTs}`} icon={<Router className="h-5 w-5 text-cyan-400" />} color="bg-cyan-500/15" />
        </div>
        <Card className="rounded-xl border-border/50 overflow-hidden">
          <CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Network Signal Path</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-3 py-4">
              {[
                { label: "OLT", icon: <Server className="h-5 w-5" />, color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
                { label: "Feeder Cable", icon: <Cable className="h-5 w-5" />, color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
                { label: "FDH", icon: <Database className="h-5 w-5" />, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
                { label: "Splitter", icon: <Radio className="h-5 w-5" />, color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
                { label: "Dist Cable", icon: <Network className="h-5 w-5" />, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
                { label: "Drop Terminal", icon: <Signal className="h-5 w-5" />, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
                { label: "ONT", icon: <Router className="h-5 w-5" />, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
                { label: "Customer", icon: <Home className="h-5 w-5" />, color: "text-foreground border-border bg-secondary" },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={cn("flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3", item.color)}>{item.icon}<span className="text-xs font-medium whitespace-nowrap">{item.label}</span></div>
                  {i < 7 && <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">OLT Devices</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sampleOLTs.map((olt) => (
              <Card key={olt.id} className="cursor-pointer rounded-xl border-border/50 transition-all hover:border-primary/50" onClick={() => navigate("olt", olt.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/15"><Server className="h-5 w-5 text-sky-400" /></div>
                      <div><CardTitle className="text-base text-foreground">{olt.distinguishedName}</CardTitle><p className="text-xs text-muted-foreground">{olt.specification}</p></div>
                    </div>
                    <StatusBadge status={olt.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div><p className="text-lg font-bold text-foreground">{olt.racks.length}</p><p className="text-xs text-muted-foreground">Racks</p></div>
                    <div><p className="text-lg font-bold text-foreground">{olt.racks.reduce((a, r) => a + r.shelves.reduce((b, s) => b + s.slots.filter((sl) => sl.card).length, 0), 0)}</p><p className="text-xs text-muted-foreground">Cards</p></div>
                    <div><p className="text-lg font-bold text-foreground">{olt.feederCables.length}</p><p className="text-xs text-muted-foreground">Feeders</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">FDH Cabinets</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sampleFDHs.map((fdh) => (
              <Card key={fdh.id} className="cursor-pointer rounded-xl border-border/50 transition-all hover:border-primary/50" onClick={() => navigate("fdh", fdh.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15"><Database className="h-5 w-5 text-emerald-400" /></div>
                      <div><CardTitle className="text-base text-foreground">{fdh.name}</CardTitle><p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {fdh.location}</p></div>
                    </div>
                    <StatusBadge status={fdh.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div><p className="text-lg font-bold text-foreground">{fdh.feederPorts.filter((p) => p.status === "active").length}</p><p className="text-xs text-muted-foreground">Feeder In</p></div>
                    <div><p className="text-lg font-bold text-foreground">{fdh.splitters.length}</p><p className="text-xs text-muted-foreground">Splitters</p></div>
                    <div><p className="text-lg font-bold text-foreground">{fdh.totalPorts}</p><p className="text-xs text-muted-foreground">Total Ports</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderOLTDetail = () => {
    const olt = sampleOLTs.find((o) => o.id === selectedNodeId)
    if (!olt) return <p className="text-muted-foreground">OLT not found</p>
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Physical Device - Optical Line Terminal</h2>
            <p className="text-muted-foreground mt-1">{olt.distinguishedName}</p>
          </div>
          <StatusBadge status={olt.status} />
        </div>
        
        {/* Interactive Device Visual */}
        <Card className="rounded-xl border-border/50 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Device Explorer - Click to Drill Down</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <InteractiveDeviceVisual olt={olt} />
          </CardContent>
        </Card>

        {/* Device Information */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DetailRow label="Distinguished Name" value={olt.distinguishedName} />
              <DetailRow label="Common Name" value={olt.commonName} />
              <DetailRow label="Specification" value={<span className="text-primary">{olt.specification}</span>} />
              <DetailRow label="Network Status" value={olt.networkStatus} />
              <DetailRow label="Created By" value={olt.createdBy} />
              <DetailRow label="Create Date" value={olt.createDate} />
              <DetailRow label="Last Updated By" value={olt.lastUpdatedBy} />
              <DetailRow label="Last Updated Date" value={olt.lastUpdatedDate} />
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
                  <p className="text-xl font-bold text-sky-400">{olt.racks.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Racks</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xl font-bold text-emerald-400">{olt.racks.reduce((a, r) => a + r.shelves.reduce((b, s) => b + s.slots.filter((sl) => sl.card).length, 0), 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cards</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xl font-bold text-amber-400">{olt.feederCables.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Feeders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feeder Cables */}
        <Card className="rounded-xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Feeder Cables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {olt.feederCables.map((fc) => (
                <button
                  key={fc.id}
                  onClick={() => navigate("feeder-cable", fc.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/15">
                      <Cable className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{fc.name}</p>
                      <p className="text-xs text-muted-foreground">{fc.strandCount} strands</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={fc.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderRackDetail = () => {
    let foundRack = null as any, parentOlt = null as any
    for (const olt of sampleOLTs) { const rack = olt.racks.find((r) => r.id === selectedNodeId); if (rack) { foundRack = rack; parentOlt = olt; break } }
    if (!foundRack) return <p className="text-muted-foreground">Rack not found</p>
    return (<div className="space-y-6"><div><h2 className="text-2xl font-bold text-foreground">{foundRack.name}</h2><p className="text-muted-foreground mt-1">Equipment Rack in {parentOlt.distinguishedName}</p></div><HardwareImage type="rack" /><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Shelves</CardTitle></CardHeader><CardContent><div className="space-y-3">{foundRack.shelves.map((shelf: any) => (<button key={shelf.id} onClick={() => navigate("shelf", shelf.id)} className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/15"><Layers className="h-4 w-4 text-sky-400" /></div><div className="text-left"><p className="text-sm font-medium text-foreground">{shelf.name}</p><p className="text-xs text-muted-foreground">{shelf.slots.length} slots</p></div></div><div className="flex items-center gap-2"><StatusBadge status={shelf.status} /><ChevronRight className="h-4 w-4 text-muted-foreground" /></div></button>))}</div></CardContent></Card></div>)
  }

  const renderShelfDetail = () => {
    let foundShelf = null as any
    for (const olt of sampleOLTs) { for (const rack of olt.racks) { const shelf = rack.shelves.find((s) => s.id === selectedNodeId); if (shelf) { foundShelf = shelf; break } } }
    if (!foundShelf) return <p className="text-muted-foreground">Shelf not found</p>
    return (<div className="space-y-6"><div><h2 className="text-2xl font-bold text-foreground">{foundShelf.name}</h2><p className="text-muted-foreground mt-1">Shelf Unit</p></div><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Slots</CardTitle></CardHeader><CardContent><div className="space-y-3">{foundShelf.slots.map((slot: any) => (<button key={slot.id} onClick={() => navigate("slot", slot.id)} className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"><div className="flex items-center gap-3"><div className={cn("flex h-8 w-8 items-center justify-center rounded-md", slot.card ? "bg-emerald-500/15" : "bg-secondary")}><Box className={cn("h-4 w-4", slot.card ? "text-emerald-400" : "text-muted-foreground")} /></div><div className="text-left"><p className="text-sm font-medium text-foreground">{slot.name}</p><p className="text-xs text-muted-foreground">{slot.card ? slot.card.type : "Empty Slot"}</p></div></div><div className="flex items-center gap-2"><StatusBadge status={slot.status} /><ChevronRight className="h-4 w-4 text-muted-foreground" /></div></button>))}</div></CardContent></Card></div>)
  }

  const renderSlotDetail = () => {
    let foundSlot = null as any
    for (const olt of sampleOLTs) { for (const rack of olt.racks) { for (const shelf of rack.shelves) { const slot = shelf.slots.find((s) => s.id === selectedNodeId); if (slot) { foundSlot = slot; break } } } }
    if (!foundSlot) return <p className="text-muted-foreground">Slot not found</p>
    return (<div className="space-y-6"><div><h2 className="text-2xl font-bold text-foreground">{foundSlot.name}</h2><p className="text-muted-foreground mt-1">{foundSlot.card ? `Contains: ${foundSlot.card.type}` : "Empty Slot"}</p></div>{foundSlot.card && (<Card className="rounded-xl border-border/50 cursor-pointer hover:border-primary/50 transition-all" onClick={() => navigate("card", foundSlot.card.id)}><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Network Card: {foundSlot.card.name}</CardTitle></CardHeader><CardContent><DetailRow label="Type" value={foundSlot.card.type} /><DetailRow label="Status" value={<StatusBadge status={foundSlot.card.status} />} /><DetailRow label="Ports" value={`${foundSlot.card.ports.length} total, ${foundSlot.card.ports.filter((p: any) => p.status === "active").length} active`} /></CardContent></Card>)}</div>)
  }

  const renderCardDetail = () => {
    let foundCard = null as any
    for (const olt of sampleOLTs) { for (const rack of olt.racks) { for (const shelf of rack.shelves) { for (const slot of shelf.slots) { if (slot.card?.id === selectedNodeId) { foundCard = slot.card; break } } } } }
    if (!foundCard) return <p className="text-muted-foreground">Card not found</p>
    return (<div className="space-y-6"><div><h2 className="text-2xl font-bold text-foreground">{foundCard.name}</h2><p className="text-muted-foreground mt-1">{foundCard.type}</p></div><HardwareImage type="card" /><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Physical Ports</CardTitle></CardHeader><CardContent><PortGrid ports={foundCard.ports} /></CardContent></Card></div>)
  }

  const renderFeederCableDetail = () => {
    let foundCable = null as any, parentOlt = null as any
    for (const olt of sampleOLTs) { const fc = olt.feederCables.find((f) => f.id === selectedNodeId); if (fc) { foundCable = fc; parentOlt = olt; break } }
    if (!foundCable) return <p className="text-muted-foreground">Feeder cable not found</p>
    const destFdh = sampleFDHs.find((f) => f.id === foundCable.destinationFdhId)
    return (<div className="space-y-6"><div><h2 className="text-2xl font-bold text-foreground">{foundCable.name}</h2><p className="text-muted-foreground mt-1">Feeder Cable - Fiber Optic</p></div><HardwareImage type="feeder-cable" /><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Cable Details</CardTitle></CardHeader><CardContent><DetailRow label="Strand Count" value={`${foundCable.strandCount} glass fibers`} /><DetailRow label="Status" value={<StatusBadge status={foundCable.status} />} /></CardContent></Card><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Connections</CardTitle></CardHeader><CardContent><DetailRow label="Source OLT" value={<button onClick={() => navigate("olt", parentOlt.id)} className="text-primary hover:underline">{parentOlt.distinguishedName}</button>} />{destFdh && <DetailRow label="Destination FDH" value={<button onClick={() => navigate("fdh", destFdh.id)} className="text-primary hover:underline">{destFdh.name}</button>} />}</CardContent></Card></div></div>)
  }

  const renderFDHDetail = () => {
    const fdh = sampleFDHs.find((f) => f.id === selectedNodeId)
    if (!fdh) return <p className="text-muted-foreground">FDH not found</p>
    const connectedDCs = sampleDistributionCables.filter((dc) => dc.sourceFdhId === fdh.id)
    return (<div className="space-y-6"><div className="flex items-start justify-between flex-wrap gap-4"><div><h2 className="text-2xl font-bold text-foreground">Fiber Distribution Hub</h2><p className="text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {fdh.location}</p></div><StatusBadge status={fdh.status} /></div><HardwareImage type="fdh" /><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Feeder Ports (Inports)</CardTitle></CardHeader><CardContent><PortGrid ports={fdh.feederPorts} /></CardContent></Card><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Splitters</CardTitle></CardHeader><CardContent><div className="space-y-3">{fdh.splitters.map((spl) => (<button key={spl.id} onClick={() => navigate("splitter", spl.id)} className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/15"><Radio className="h-4 w-4 text-violet-400" /></div><div className="text-left"><p className="text-sm font-medium text-foreground">{spl.name}</p><p className="text-xs text-muted-foreground">Ratio: {spl.ratio} | {spl.outputPorts.length} output legs</p></div></div><div className="flex items-center gap-2"><StatusBadge status={spl.status} /><ChevronRight className="h-4 w-4 text-muted-foreground" /></div></button>))}</div></CardContent></Card><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Distribution Cables (Outgoing)</CardTitle></CardHeader><CardContent><div className="space-y-3">{connectedDCs.map((dc) => (<button key={dc.id} onClick={() => navigate("distribution-cable", dc.id)} className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15"><Network className="h-4 w-4 text-emerald-400" /></div><div className="text-left"><p className="text-sm font-medium text-foreground">{dc.name}</p><p className="text-xs text-muted-foreground">{dc.strandCount} strands | {dc.dropTerminals.length} drop terminals</p></div></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>))}</div></CardContent></Card></div>)
  }

  const renderSplitterDetail = () => {
    let foundSplitter = null as any
    for (const fdh of sampleFDHs) { const spl = fdh.splitters.find((s) => s.id === selectedNodeId); if (spl) { foundSplitter = spl; break } }
    if (!foundSplitter) return <p className="text-muted-foreground">Splitter not found</p>
    return (<div className="space-y-6"><div><h2 className="text-2xl font-bold text-foreground">{foundSplitter.name}</h2><p className="text-muted-foreground mt-1">Optical Splitter - Ratio {foundSplitter.ratio}</p></div><HardwareImage type="splitter" /><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Output Ports ({foundSplitter.outputPorts.length})</CardTitle></CardHeader><CardContent><PortGrid ports={foundSplitter.outputPorts} /></CardContent></Card></div>)
  }

  const renderDistCableDetail = () => {
    const dc = sampleDistributionCables.find((d) => d.id === selectedNodeId)
    if (!dc) return <p className="text-muted-foreground">Distribution cable not found</p>
    return (<div className="space-y-6"><div><h2 className="text-2xl font-bold text-foreground">{dc.name}</h2><p className="text-muted-foreground mt-1">Distribution Cable - {dc.strandCount} strands</p></div><HardwareImage type="distribution-cable" /><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Drop Terminals Served</CardTitle></CardHeader><CardContent><div className="space-y-3">{dc.dropTerminals.map((dt) => (<button key={dt.id} onClick={() => navigate("drop-terminal", dt.id)} className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/15"><Signal className="h-4 w-4 text-amber-400" /></div><div className="text-left"><p className="text-sm font-medium text-foreground">{dt.name}</p><p className="text-xs text-muted-foreground">{dt.portCount} ports | {dt.location}</p></div></div><div className="flex items-center gap-2"><StatusBadge status={dt.status} /><ChevronRight className="h-4 w-4 text-muted-foreground" /></div></button>))}</div></CardContent></Card></div>)
  }

  const renderDropTerminalDetail = () => {
    const dt = sampleDropTerminals.find((d) => d.id === selectedNodeId)
    if (!dt) return <p className="text-muted-foreground">Drop terminal not found</p>
    const dtONTs = sampleONTs.filter((o) => o.dropTerminalId === dt.id)
    return (<div className="space-y-6"><div className="flex items-start justify-between flex-wrap gap-4"><div><h2 className="text-2xl font-bold text-foreground">{dt.name}</h2><p className="text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {dt.location}</p></div><StatusBadge status={dt.status} /></div><HardwareImage type="drop-terminal" /><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Drop Ports ({dt.portCount})</CardTitle></CardHeader><CardContent><PortGrid ports={dt.ports} /></CardContent></Card>{dtONTs.length > 0 && (<Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Connected ONTs</CardTitle></CardHeader><CardContent><div className="space-y-3">{dtONTs.map((ont) => (<button key={ont.id} onClick={() => navigate("ont", ont.id)} className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/15"><Router className="h-4 w-4 text-cyan-400" /></div><div className="text-left"><p className="text-sm font-medium text-foreground">{ont.name}</p><p className="text-xs text-muted-foreground">{ont.address} {ont.customerName && `- ${ont.customerName}`}</p></div></div><div className="flex items-center gap-2"><StatusBadge status={ont.status} /><ChevronRight className="h-4 w-4 text-muted-foreground" /></div></button>))}</div></CardContent></Card>)}</div>)
  }

  const renderONTDetail = () => {
    const ont = sampleONTs.find((o) => o.id === selectedNodeId)
    if (!ont) return <p className="text-muted-foreground">ONT not found</p>
    const parentDt = sampleDropTerminals.find((d) => d.id === ont.dropTerminalId)
    return (<div className="space-y-6"><div className="flex items-start justify-between flex-wrap gap-4"><div><h2 className="text-2xl font-bold text-foreground">{ont.name}</h2><p className="text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {ont.address}</p></div><StatusBadge status={ont.status} /></div><HardwareImage type="ont" /><div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">ONT Information</CardTitle></CardHeader><CardContent className="space-y-0"><DetailRow label="Model" value={ont.model} /><DetailRow label="Serial Number" value={<span className="font-mono">{ont.serialNumber}</span>} /><DetailRow label="MDU" value={ont.isMDU ? "Yes (Multi-Dwelling Unit)" : "No"} /><DetailRow label="Customer" value={ont.customerName || "Unassigned"} /><DetailRow label="Service Status" value={<Badge variant="outline" className={cn("rounded-md text-xs", ont.serviceStatus === "working" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : ont.serviceStatus === "pending" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" : "border-zinc-500/30 text-zinc-400 bg-zinc-500/10")}>{ont.serviceStatus}</Badge>} />{parentDt && <DetailRow label="Drop Terminal" value={<button onClick={() => navigate("drop-terminal", parentDt.id)} className="text-primary hover:underline">{parentDt.name}</button>} />}</CardContent></Card>
      <Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Ports</CardTitle></CardHeader><CardContent><div><p className="text-xs text-muted-foreground mb-2">Ethernet Ports</p><div className="flex flex-wrap gap-2">{Array.from({ length: Math.min(ont.ethernetPorts, 8) }, (_, i) => (<div key={i} className={cn("flex h-8 w-10 items-center justify-center rounded border text-xs font-mono", i < 2 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-border/50 text-muted-foreground")}>E{i + 1}</div>))}{ont.ethernetPorts > 8 && <span className="text-xs text-muted-foreground self-center">+{ont.ethernetPorts - 8} more</span>}</div></div><div className="mt-3"><p className="text-xs text-muted-foreground mb-2">Voice Ports</p><div className="flex flex-wrap gap-2">{Array.from({ length: Math.min(ont.voicePorts, 8) }, (_, i) => (<div key={i} className="flex h-8 w-10 items-center justify-center rounded border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-400">V{i + 1}</div>))}{ont.voicePorts > 8 && <span className="text-xs text-muted-foreground self-center">+{ont.voicePorts - 8} more</span>}</div></div></CardContent></Card>
    </div><Card className="rounded-xl border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Customer Premises Equipment</CardTitle></CardHeader><CardContent><div className="flex flex-wrap items-center gap-3 py-2"><div className="flex flex-col items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3"><Router className="h-5 w-5 text-cyan-400" /><span className="text-xs text-cyan-400">ONT</span></div><ArrowRight className="h-4 w-4 text-muted-foreground" /><div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary px-4 py-3"><Wifi className="h-5 w-5 text-foreground" /><span className="text-xs text-foreground">Router/RG</span></div><ArrowRight className="h-4 w-4 text-muted-foreground" /><div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary px-4 py-3"><Home className="h-5 w-5 text-foreground" /><span className="text-xs text-foreground">Customer</span></div></div></CardContent></Card></div>)
  }

  // Sidebar tree for the network content
  const renderSidebarTree = () => (
    <div className="space-y-1">
      <TreeNode label="Network Overview" nodeType="overview" nodeId="overview" isSelected={selectedNodeType === "overview" && selectedNodeId === "overview"} onSelect={navigate} />
      <div className="pt-3 pb-1 px-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">OLT Devices</p></div>
      {sampleOLTs.map((olt) => (
        <TreeNode key={olt.id} label={olt.distinguishedName} nodeType="olt" nodeId={olt.id} status={olt.status} isSelected={selectedNodeType === "olt" && selectedNodeId === olt.id} onSelect={navigate}>
          {olt.racks.map((rack) => (<TreeNode key={rack.id} label={rack.name} nodeType="rack" nodeId={rack.id} status={rack.status} isSelected={selectedNodeType === "rack" && selectedNodeId === rack.id} onSelect={navigate} depth={1}>{rack.shelves.map((shelf) => (<TreeNode key={shelf.id} label={shelf.name} nodeType="shelf" nodeId={shelf.id} status={shelf.status} isSelected={selectedNodeType === "shelf" && selectedNodeId === shelf.id} onSelect={navigate} depth={2}>{shelf.slots.map((slot) => (<TreeNode key={slot.id} label={`${slot.name}${slot.card ? ` (${slot.card.type})` : " (Empty)"}`} nodeType="slot" nodeId={slot.id} status={slot.status} isSelected={selectedNodeType === "slot" && selectedNodeId === slot.id} onSelect={navigate} depth={3}>{slot.card && (<TreeNode key={slot.card.id} label={slot.card.name} nodeType="card" nodeId={slot.card.id} status={slot.card.status} isSelected={selectedNodeType === "card" && selectedNodeId === slot.card.id} onSelect={navigate} depth={4} />)}</TreeNode>))}</TreeNode>))}</TreeNode>))}
          {olt.feederCables.map((fc) => (<TreeNode key={fc.id} label={fc.name} nodeType="feeder-cable" nodeId={fc.id} status={fc.status} isSelected={selectedNodeType === "feeder-cable" && selectedNodeId === fc.id} onSelect={navigate} depth={1} />))}
        </TreeNode>
      ))}
      <div className="pt-4 pb-1 px-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">FDH Cabinets</p></div>
      {sampleFDHs.map((fdh) => (<TreeNode key={fdh.id} label={fdh.name} nodeType="fdh" nodeId={fdh.id} status={fdh.status} isSelected={selectedNodeType === "fdh" && selectedNodeId === fdh.id} onSelect={navigate}>{fdh.splitters.map((spl) => (<TreeNode key={spl.id} label={`${spl.name} (${spl.ratio})`} nodeType="splitter" nodeId={spl.id} status={spl.status} isSelected={selectedNodeType === "splitter" && selectedNodeId === spl.id} onSelect={navigate} depth={1} />))}</TreeNode>))}
      <div className="pt-4 pb-1 px-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Distribution</p></div>
      {sampleDistributionCables.map((dc) => (<TreeNode key={dc.id} label={dc.name} nodeType="distribution-cable" nodeId={dc.id} status={dc.status} isSelected={selectedNodeType === "distribution-cable" && selectedNodeId === dc.id} onSelect={navigate}>{dc.dropTerminals.map((dt) => (<TreeNode key={dt.id} label={dt.name} nodeType="drop-terminal" nodeId={dt.id} status={dt.status} isSelected={selectedNodeType === "drop-terminal" && selectedNodeId === dt.id} onSelect={navigate} depth={1}>{sampleONTs.filter((o) => o.dropTerminalId === dt.id).map((ont) => (<TreeNode key={ont.id} label={ont.name} nodeType="ont" nodeId={ont.id} status={ont.status} isSelected={selectedNodeType === "ont" && selectedNodeId === ont.id} onSelect={navigate} depth={2} />))}</TreeNode>))}</TreeNode>))}
    </div>
  )

  return (
    <div className="flex gap-6">
      {/* Collapsible tree panel */}
      <div className={cn("shrink-0 transition-all duration-200", treePanelOpen ? "w-72" : "w-0 overflow-hidden")}>
        <Card className="rounded-xl border-border/50 h-[calc(100vh-180px)] sticky top-[100px]">
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Network Tree</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTreePanelOpen(false)}>
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            </Button>
          </div>
          <div className="p-2">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input type="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 rounded-lg bg-secondary pl-8 pr-3 text-xs" />
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-90px)] px-2">
            {renderSidebarTree()}
          </ScrollArea>
        </Card>
      </div>

      {!treePanelOpen && (
        <Button variant="outline" size="icon" className="shrink-0 h-8 w-8 rounded-lg sticky top-[100px]" onClick={() => setTreePanelOpen(true)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Detail panel */}
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <NetworkBreadcrumb items={breadcrumbs} onNavigate={(index) => { const item = breadcrumbs[index]; navigate(item.nodeType, item.nodeId) }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={`${selectedNodeType}-${selectedNodeId}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {renderDetailPanel()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
