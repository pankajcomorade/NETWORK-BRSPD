"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Server,
  HardDrive,
  Layers,
  Box,
  CircuitBoard,
  Zap,
  CornerDownRight,
  Grid3x3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  type OLT,
  type Rack,
  type Shelf,
  type Slot,
  type NetworkCard,
  type Port,
  type DeviceStatus,
  sampleOLTs,
} from "@/lib/network-data"

// ==========================================
// Type definitions for navigation breadcrumb
// ==========================================
type NavigationLevel = "container" | "rack" | "shelf" | "slot" | "card" | "port"

interface NavigationState {
  level: NavigationLevel
  container?: OLT
  rack?: Rack
  shelf?: Shelf
  slot?: Slot
  card?: NetworkCard
  port?: Port
}

// ==========================================
// Status styles
// ==========================================
function getStatusColor(status: DeviceStatus): string {
  const map: Record<DeviceStatus, string> = {
    active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    inactive: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    maintenance: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  }
  return map[status]
}

function StatusDot({ status }: { status: DeviceStatus }) {
  const colorMap: Record<DeviceStatus, string> = {
    active: "bg-emerald-500",
    inactive: "bg-zinc-500",
    warning: "bg-amber-500",
    maintenance: "bg-sky-500",
  }
  return <span className={cn("inline-block h-2 w-2 rounded-full", colorMap[status])} />
}

// ==========================================
// Container (OLT) View - Grid of Racks
// ==========================================
function ContainerView({
  container,
  onRackSelect,
}: {
  container: OLT
  onRackSelect: (rack: Rack) => void
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <Server className="h-6 w-6 text-sky-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-100">{container.name}</h2>
            <p className="text-xs text-slate-400 mt-1">{container.specification}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusDot status={container.status} />
              <span className="text-xs text-slate-400">{container.status}</span>
              <span className="text-xs text-slate-500 ml-2">• {container.racks.length} Racks</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence>
          {container.racks.map((rack, idx) => (
            <motion.button
              key={rack.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onRackSelect(rack)}
              className={cn(
                "p-3 rounded-lg border-2 transition-all hover:scale-105 text-left",
                rack.status === "active"
                  ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 hover:bg-emerald-500/10"
                  : "border-slate-600/30 bg-slate-700/10 hover:border-slate-600/60"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-slate-700/50 rounded">
                  <HardDrive className="h-4 w-4 text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-100 truncate">{rack.name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <StatusDot status={rack.status} />
                    <span className="text-xs text-slate-400">{rack.shelves.length} Shelves</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0 mt-1" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ==========================================
// Rack View - Grid of Shelves
// ==========================================
function RackView({
  rack,
  onShelfSelect,
}: {
  rack: Rack
  onShelfSelect: (shelf: Shelf) => void
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <HardDrive className="h-6 w-6 text-sky-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-100">{rack.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <StatusDot status={rack.status} />
              <span className="text-xs text-slate-400">{rack.status}</span>
              <span className="text-xs text-slate-500 ml-2">• {rack.shelves.length} Shelves</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {rack.shelves.map((shelf, idx) => (
            <motion.button
              key={shelf.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onShelfSelect(shelf)}
              className={cn(
                "p-3 rounded-lg border-2 transition-all hover:scale-105 text-left",
                shelf.status === "active"
                  ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 hover:bg-emerald-500/10"
                  : "border-slate-600/30 bg-slate-700/10 hover:border-slate-600/60"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-slate-700/50 rounded">
                  <Layers className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-100">{shelf.name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <StatusDot status={shelf.status} />
                    <span className="text-xs text-slate-400">{shelf.slots.length} Slots</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0 mt-1" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ==========================================
// Shelf View - Grid of Slots
// ==========================================
function ShelfView({
  shelf,
  onSlotSelect,
}: {
  shelf: Shelf
  onSlotSelect: (slot: Slot) => void
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <Layers className="h-6 w-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-100">{shelf.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <StatusDot status={shelf.status} />
              <span className="text-xs text-slate-400">{shelf.status}</span>
              <span className="text-xs text-slate-500 ml-2">• {shelf.slots.length} Slots</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <AnimatePresence>
          {shelf.slots.map((slot, idx) => (
            <motion.button
              key={slot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onSlotSelect(slot)}
              className={cn(
                "p-3 rounded-lg border-2 transition-all hover:scale-105 text-left",
                slot.card
                  ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 hover:bg-emerald-500/10"
                  : "border-slate-600/30 bg-slate-700/10 hover:border-slate-600/60"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-slate-700/50 rounded">
                  <Box className="h-4 w-4 text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-100">{slot.name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <StatusDot status={slot.status} />
                    <span className="text-xs text-slate-400">
                      {slot.card ? "Card" : "Empty"}
                    </span>
                  </div>
                </div>
                {slot.card && <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0 mt-1" />}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ==========================================
// Slot View - Shows Card and Ports
// ==========================================
function SlotView({
  slot,
  onCardSelect,
}: {
  slot: Slot
  onCardSelect: (card: NetworkCard) => void
}) {
  if (!slot.card) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-700/50 rounded-lg">
              <Box className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{slot.name}</h2>
              <p className="text-sm text-slate-400 mt-2">This slot is empty</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <Box className="h-6 w-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-100">{slot.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <StatusDot status={slot.status} />
              <span className="text-xs text-slate-400">{slot.status}</span>
            </div>
          </div>
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => onCardSelect(slot.card!)}
        className="w-full p-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <CircuitBoard className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-100">{slot.card.name}</div>
            <div className="text-xs text-slate-400 mt-1">{slot.card.type}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusDot status={slot.card.status} />
            <span className="text-xs text-slate-400">{slot.card.ports.length} Ports</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500 ml-2" />
        </div>
      </motion.button>
    </div>
  )
}

// ==========================================
// Card View - Grid of Ports
// ==========================================
function CardView({ card }: { card: NetworkCard }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <CircuitBoard className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-100">{card.name}</h2>
            <p className="text-xs text-slate-400 mt-1">{card.type}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusDot status={card.status} />
              <span className="text-xs text-slate-400">{card.status}</span>
              <span className="text-xs text-slate-500 ml-2">• {card.ports.length} Ports</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <AnimatePresence>
          {card.ports.map((port, idx) => (
            <motion.div
              key={port.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={cn(
                "p-3 rounded-lg border transition-all",
                port.status === "active"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : port.status === "inactive"
                    ? "border-zinc-600/30 bg-zinc-700/10"
                    : port.status === "warning"
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-sky-500/30 bg-sky-500/5"
              )}
            >
              <div className="flex items-center gap-2">
                <StatusDot status={port.status} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-100">{port.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{port.type}</div>
                </div>
                <div className="p-1.5 bg-slate-700/50 rounded">
                  <Zap className="h-3 w-3 text-yellow-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ==========================================
// Main Visual Hierarchy Explorer
// ==========================================
export function VisualHierarchyExplorer({
  selectedOltId,
}: {
  selectedOltId?: string
}) {
  const olt = sampleOLTs.find((o) => o.id === selectedOltId) || sampleOLTs[0]
  const [navigation, setNavigation] = useState<NavigationState>({
    level: "container",
    container: olt,
  })

  const handleRackSelect = useCallback((rack: Rack) => {
    setNavigation({
      level: "rack",
      container: olt,
      rack,
    })
  }, [olt])

  const handleShelfSelect = useCallback((shelf: Shelf) => {
    setNavigation((prev) => ({
      ...prev,
      level: "shelf",
      shelf,
    }))
  }, [])

  const handleSlotSelect = useCallback((slot: Slot) => {
    setNavigation((prev) => ({
      ...prev,
      level: "slot",
      slot,
    }))
  }, [])

  const handleCardSelect = useCallback((card: NetworkCard) => {
    setNavigation((prev) => ({
      ...prev,
      level: "card",
      card,
    }))
  }, [])

  const handleBack = useCallback(() => {
    setNavigation((prev) => {
      switch (prev.level) {
        case "rack":
          return { level: "container", container: prev.container }
        case "shelf":
          return { level: "rack", container: prev.container, rack: prev.rack }
        case "slot":
          return { level: "shelf", container: prev.container, rack: prev.rack, shelf: prev.shelf }
        case "card":
          return {
            level: "slot",
            container: prev.container,
            rack: prev.rack,
            shelf: prev.shelf,
            slot: prev.slot,
          }
        default:
          return prev
      }
    })
  }, [])

  // Breadcrumb navigation
  const getBreadcrumbs = () => {
    const crumbs: { label: string; icon: React.ReactNode; level: NavigationLevel }[] = []

    crumbs.push({
      label: navigation.container?.name || "Container",
      icon: <Server className="h-3 w-3" />,
      level: "container",
    })

    if (navigation.rack) {
      crumbs.push({
        label: navigation.rack.name,
        icon: <HardDrive className="h-3 w-3" />,
        level: "rack",
      })
    }

    if (navigation.shelf) {
      crumbs.push({
        label: navigation.shelf.name,
        icon: <Layers className="h-3 w-3" />,
        level: "shelf",
      })
    }

    if (navigation.slot) {
      crumbs.push({
        label: navigation.slot.name,
        icon: <Box className="h-3 w-3" />,
        level: "slot",
      })
    }

    if (navigation.card) {
      crumbs.push({
        label: navigation.card.name,
        icon: <CircuitBoard className="h-3 w-3" />,
        level: "card",
      })
    }

    return crumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <Card className="bg-slate-950 border-slate-800">
      <CardHeader className="pb-4 border-b border-slate-800">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Grid3x3 className="h-5 w-5 text-sky-400" />
              Visual Hierarchy Navigator
            </CardTitle>
            {navigation.level !== "container" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-slate-400 hover:text-slate-100"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
                {idx > 0 && <CornerDownRight className="h-3 w-3 text-slate-600" />}
                <button
                  onClick={() => {
                    setNavigation((prev) => {
                      if (idx === 0) return { level: "container", container: prev.container }
                      if (idx === 1) return { level: "rack", container: prev.container, rack: prev.rack }
                      if (idx === 2) return { level: "shelf", container: prev.container, rack: prev.rack, shelf: prev.shelf }
                      if (idx === 3) return { level: "slot", container: prev.container, rack: prev.rack, shelf: prev.shelf, slot: prev.slot }
                      return prev
                    })
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded transition-colors",
                    idx === breadcrumbs.length - 1
                      ? "text-sky-400 bg-sky-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  )}
                >
                  {crumb.icon}
                  {crumb.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <AnimatePresence mode="wait">
          {navigation.level === "container" && navigation.container && (
            <motion.div
              key="container"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ContainerView container={navigation.container} onRackSelect={handleRackSelect} />
            </motion.div>
          )}

          {navigation.level === "rack" && navigation.rack && (
            <motion.div
              key="rack"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <RackView rack={navigation.rack} onShelfSelect={handleShelfSelect} />
            </motion.div>
          )}

          {navigation.level === "shelf" && navigation.shelf && (
            <motion.div
              key="shelf"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ShelfView shelf={navigation.shelf} onSlotSelect={handleSlotSelect} />
            </motion.div>
          )}

          {navigation.level === "slot" && navigation.slot && (
            <motion.div
              key="slot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SlotView slot={navigation.slot} onCardSelect={handleCardSelect} />
            </motion.div>
          )}

          {navigation.level === "card" && navigation.card && (
            <motion.div
              key="card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <CardView card={navigation.card} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
