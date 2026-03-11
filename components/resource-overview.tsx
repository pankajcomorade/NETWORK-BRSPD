"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Server,
  HardDrive,
  Layers,
  Box,
  CircuitBoard,
  Zap,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  fetchEquipmentHierarchy,
  DEFAULT_SEARCH_PARAMS,
  calculateHierarchySummary,
  type EquipmentNode,
  type EquipmentHierarchyResponse,
  type EquipmentSearchParams,
} from "@/lib/api/equipment-api"
import { getCurrentEnvironment } from "@/lib/env-config"

// Extended response type for UI
interface EquipmentResponse {
  equipment: EquipmentNode
  summary: {
    countsByType: Record<string, number>
    totalNodes: number
  }
}

// Current environment info
const currentEnv = getCurrentEnvironment()

// Helper to convert API response to UI format
function toEquipmentResponse(apiResponse: EquipmentHierarchyResponse): EquipmentResponse {
  return {
    equipment: apiResponse.equipment,
    summary: apiResponse.summary,
  }
}

// Helper functions for node icons and styling
const getNodeIcon = (type: string) => {
  switch (type) {
    case "OLT":
    case "FDH":
    case "AP":
      return Server
    case "RACK":
      return HardDrive
    case "SHELF":
      return Layers
    case "SLOT":
      return Box
    case "NETWORKCARD":
    case "NETWORK CARD":
      return CircuitBoard
    case "PORT":
      return Zap
    default:
      return Server
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500"
    case "INACTIVE":
      return "bg-zinc-500"
    case "WARNING":
      return "bg-amber-500"
    case "MAINTENANCE":
      return "bg-sky-500"
    default:
      return "bg-zinc-500"
  }
}

const getPortColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-500"
    case "PENDING":
      return "bg-amber-400"
    case "RETIRED":
      return "bg-rose-500"
    case "FREE":
      return "bg-sky-400"
    // legacy fallbacks
    case "WARNING":
      return "bg-amber-400"
    case "INACTIVE":
      return "bg-zinc-400"
    default:
      return "bg-zinc-400"
  }
}

const getStatusBorder = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-500/30"
    case "WARNING":
      return "border-amber-500/30"
    case "INACTIVE":
    default:
      return "border-zinc-500/30"
  }
}

// Tree Node Component for hierarchy
function HierarchyTreeNode({
  node,
  depth = 0,
  onSelect,
  selectedNode,
}: {
  node: EquipmentNode
  depth?: number
  onSelect: (node: EquipmentNode) => void
  selectedNode: EquipmentNode | null
}) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const Icon = getNodeIcon(node.type)
  const hasChildren = node.nodes && node.nodes.length > 0
  const isSelected = selectedNode?.erId === node.erId

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setIsOpen(!isOpen)
          onSelect(node)
        }}
        className={cn(
          "flex w-full items-center gap-2 py-1.5 px-2 rounded-md text-sm transition-colors hover:bg-secondary/50",
          isSelected && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3" />
        )}
        <div className={cn("h-2 w-2 rounded-full shrink-0", getStatusColor(node.status))} />
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className={cn("truncate", isSelected ? "text-primary font-medium" : "text-foreground")}>
          {node.name}
        </span>
        <Badge
          variant="outline"
          className="ml-auto text-[9px] px-1.5 py-0 h-4 border-border/50 text-muted-foreground"
        >
          {node.type}
        </Badge>
      </button>
      {hasChildren && isOpen && (
        <div>
          {node.nodes.map((child) => (
            <HierarchyTreeNode
              key={child.erId}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedNode={selectedNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Device GUI View Types
type GUIViewLevel = "container" | "rack" | "shelf" | "slot" | "card" | "ports"

interface GUIViewState {
  level: GUIViewLevel
  rack?: EquipmentNode
  shelf?: EquipmentNode
  slot?: EquipmentNode
  card?: EquipmentNode
}

// Device GUI Panel Component
function DeviceGUIPanel({
  equipment,
  selectedNode,
}: {
  equipment: EquipmentNode
  selectedNode: EquipmentNode | null
}) {
  const [viewState, setViewState] = useState<GUIViewState>({ level: "container" })

  const navigateToRack = (rack: EquipmentNode) => {
    setViewState({ level: "rack", rack })
  }

  const navigateToShelf = (shelf: EquipmentNode, rack: EquipmentNode) => {
    setViewState({ level: "shelf", rack, shelf })
  }

  const navigateToSlot = (slot: EquipmentNode, shelf: EquipmentNode, rack: EquipmentNode) => {
    setViewState({ level: "slot", rack, shelf, slot })
  }

  const navigateToCard = (card: EquipmentNode, slot: EquipmentNode, shelf: EquipmentNode, rack: EquipmentNode) => {
    setViewState({ level: "card", rack, shelf, slot, card })
  }

  const navigateToPorts = (shelf: EquipmentNode, slot: EquipmentNode, card: EquipmentNode, rack: EquipmentNode) => {
    setViewState({ level: "ports", rack, shelf, slot, card })
  }

  const goBack = () => {
    if (viewState.level === "ports") {
      setViewState({ level: "card", rack: viewState.rack, shelf: viewState.shelf, slot: viewState.slot, card: viewState.card })
    } else if (viewState.level === "card") {
      setViewState({ level: "slot", rack: viewState.rack, shelf: viewState.shelf, slot: viewState.slot })
    } else if (viewState.level === "slot") {
      setViewState({ level: "shelf", rack: viewState.rack, shelf: viewState.shelf })
    } else if (viewState.level === "shelf") {
      setViewState({ level: "rack", rack: viewState.rack })
    } else if (viewState.level === "rack") {
      setViewState({ level: "container" })
    }
  }

  // Render Container View (OLT/FDH with racks)
  const renderContainerView = () => {
    const racks = equipment.nodes.filter((n) => n.type === "RACK")
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-foreground">{equipment.name}</h3>
          <p className="text-sm text-muted-foreground">{equipment.type} - Click on a Rack to explore</p>
        </div>

        {/* OLT Device Visual */}
        <div className="relative mx-auto max-w-2xl">
          <div className={cn("rounded-xl border-2 bg-card p-6", getStatusBorder(equipment.status))}>
            {/* Device Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="w-24 h-3 rounded bg-sky-500" />
              <span className="font-mono text-lg text-muted-foreground">CALIX E7-20 OLT</span>
            </div>

            {/* Racks Grid */}
            <div className="grid grid-cols-1 gap-4">
              {racks.map((rack) => (
                <motion.button
                  key={rack.erId}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigateToRack(rack)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-left",
                    "bg-secondary/30 hover:bg-secondary/50",
                    getStatusBorder(rack.status)
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{rack.name}</span>
                    </div>
                    <div className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(rack.status))} />
                  </div>

                  {/* Shelves Preview */}
                  <div className="grid grid-cols-4 gap-2">
                    {rack.nodes
                      .filter((n) => n.type === "SHELF")
                      .map((shelf) => (
                        <div
                          key={shelf.erId}
                          className={cn(
                            "p-2 rounded border text-center text-xs font-mono",
                            shelf.status === "ACTIVE"
                              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                              : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
                          )}
                        >
                          {shelf.name}
                        </div>
                      ))}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <div className="h-3 w-3 rounded-full bg-sky-500" />
                <div className="h-3 w-3 rounded-full bg-zinc-600" />
                <div className="h-3 w-3 rounded-full bg-zinc-600" />
              </div>
              <span className="text-sm text-muted-foreground font-mono">PWR | SYS | ALM | ACT</span>
            </div>

            <div className="mt-3 text-xs text-muted-foreground font-mono">
              S/N: CAX720-2021-07B
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Rack View — shelves expanded inline, slots are directly clickable
  const renderRackView = () => {
    if (!viewState.rack) return null
    const shelves = viewState.rack.nodes.filter((n) => n.type === "SHELF")

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{viewState.rack.name}</h3>
            <p className="text-sm text-muted-foreground">Click on a Slot to drill in</p>
          </div>
        </div>

        <div className={cn("rounded-xl border-2 bg-card p-6 space-y-5 max-w-3xl mx-auto", getStatusBorder(viewState.rack.status))}>
          {shelves.map((shelf) => {
            const slots = shelf.nodes.filter((n) => n.type === "SLOT")
            return (
              <div key={shelf.erId} className={cn("rounded-lg border-2 p-4", getStatusBorder(shelf.status))}>
                {/* Shelf header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{shelf.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      shelf.status === "ACTIVE"
                        ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                        : "border-zinc-400/40 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {shelf.status}
                  </Badge>
                </div>

                {/* Slots grid — each directly clickable */}
                <div className="grid grid-cols-4 gap-3">
                  {slots.map((slot) => {
                    const card = slot.nodes.find((n) => n.type === "NETWORKCARD" || n.type === "NETWORK CARD")
                    const hasCard = !!card
                    return (
                      <motion.button
                        key={slot.erId}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigateToSlot(slot, shelf, viewState.rack!)}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all text-center",
                          "bg-card hover:bg-secondary/50",
                          hasCard
                            ? "border-primary/40 hover:border-primary/70"
                            : "border-border/50 hover:border-border"
                        )}
                      >
                        <Box
                          className={cn(
                            "h-8 w-8 mx-auto mb-2",
                            hasCard ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <p className="font-mono text-sm font-semibold text-foreground">{slot.name}</p>
                        {hasCard && card ? (
                          <p className="text-xs text-primary mt-1">{card.name}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">Empty</p>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Shelf view kept as fallback but rack view now handles slot navigation directly
  const renderShelfView = () => {
    // Redirect: if we land here from rack, go to slot directly
    if (!viewState.shelf || !viewState.rack) return null
    const slots = viewState.shelf.nodes.filter((n) => n.type === "SLOT")

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{viewState.shelf.name}</h3>
            <p className="text-sm text-muted-foreground">Click on a Slot to view its contents</p>
          </div>
        </div>

        <div className={cn("rounded-xl border-2 bg-card p-6 max-w-3xl mx-auto", getStatusBorder(viewState.shelf.status))}>
          <div className="grid grid-cols-4 gap-4">
            {slots.map((slot) => {
              const card = slot.nodes.find((n) => n.type === "NETWORKCARD" || n.type === "NETWORK CARD")
              const hasCard = !!card
              return (
                <motion.button
                  key={slot.erId}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToSlot(slot, viewState.shelf!, viewState.rack!)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all cursor-pointer text-center",
                    "bg-card hover:bg-secondary/50",
                    hasCard ? "border-primary/40 hover:border-primary/70" : "border-border/50"
                  )}
                >
                  <Box className={cn("h-8 w-8 mx-auto mb-2", hasCard ? "text-primary" : "text-muted-foreground")} />
                  <p className="font-mono text-sm font-semibold text-foreground">{slot.name}</p>
                  {hasCard && card ? (
                    <p className="text-xs text-primary mt-1">{card.name}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Empty</p>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Render Slot View - Show Network Card inside the slot
  const renderSlotView = () => {
    if (!viewState.slot || !viewState.shelf || !viewState.rack) return null
    const card = viewState.slot.nodes.find((n) => n.type === "NETWORKCARD" || n.type === "NETWORK CARD")

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{viewState.slot.name}</h3>
            <p className="text-sm text-muted-foreground">
              {card ? "Click on the Network Card to view ports" : "This slot is empty"}
            </p>
          </div>
        </div>

        <div className={cn("rounded-xl border-2 bg-card p-6 max-w-2xl mx-auto", getStatusBorder(viewState.slot.status))}>
          {card ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigateToCard(card, viewState.slot!, viewState.shelf!, viewState.rack!)}
              className={cn(
                "w-full p-6 rounded-lg border-2 transition-all cursor-pointer",
                "bg-secondary/30 hover:bg-secondary/50",
                getStatusBorder(card.status)
              )}
            >
              <div className="flex items-center gap-4">
                <CircuitBoard className="h-12 w-12 text-primary" />
                <div className="text-left">
                  <p className="font-mono text-lg text-foreground">{card.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {card.nodes.filter((n) => n.type === "PORT").length} Ports
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-2 text-[10px]",
                      card.status === "ACTIVE"
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : "border-zinc-500/30 text-zinc-400"
                    )}
                  >
                    {card.status}
                  </Badge>
                </div>
              </div>
            </motion.button>
          ) : (
            <div className="text-center py-12">
              <Box className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
              <p className="text-muted-foreground">No Network Card installed in this slot</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render Card View - Show ports inside the card
  const renderCardView = () => {
    if (!viewState.card || !viewState.slot || !viewState.shelf || !viewState.rack) return null
    const ports = viewState.card.nodes.filter((n) => n.type === "PORT")

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{viewState.card.name}</h3>
            <p className="text-sm text-muted-foreground">Click on a Port to view details</p>
          </div>
        </div>

        <div className={cn("rounded-xl border-2 bg-card p-6 max-w-3xl mx-auto", getStatusBorder(viewState.card.status))}>
          <div className="grid grid-cols-4 gap-4">
            {ports.map((port) => (
              <motion.button
                key={port.erId}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigateToPorts(viewState.shelf!, viewState.slot!, viewState.card!, viewState.rack!)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card hover:bg-secondary/50 border border-border cursor-pointer transition-all"
              >
                <div
                  className={cn(
                    "h-11 w-11 rounded-full shadow-lg flex items-center justify-center",
                    getPortColor(port.status)
                  )}
                >
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-mono font-semibold text-foreground">{port.name}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] capitalize",
                    port.status?.toUpperCase() === "ACTIVE"
                      ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                      : port.status?.toUpperCase() === "PENDING"
                      ? "border-amber-400/40 text-amber-600 dark:text-amber-400 bg-amber-400/10"
                      : port.status?.toUpperCase() === "RETIRED"
                      ? "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                      : port.status?.toUpperCase() === "FREE"
                      ? "border-sky-400/40 text-sky-600 dark:text-sky-400 bg-sky-400/10"
                      : "border-zinc-400/40 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {port.status}
                </Badge>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render Ports View (card with ports as colored circles)
  const renderPortsView = () => {
    if (!viewState.card || !viewState.shelf) return null
    const ports = viewState.card.nodes.filter((n) => n.type === "PORT")

    const getPortColor = (status: string) => {
      switch (status) {
        case "ACTIVE":
          return "bg-emerald-500"
        case "INACTIVE":
          return "bg-zinc-600"
        case "WARNING":
          return "bg-amber-500"
        case "MAINTENANCE":
          return "bg-sky-500"
        default:
          return "bg-zinc-600"
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {viewState.shelf.name} - {viewState.card.name}
            </h3>
            <p className="text-sm text-muted-foreground">Port status overview</p>
          </div>
        </div>

        <div className={cn("rounded-xl border-2 bg-card p-8 max-w-2xl mx-auto", getStatusBorder(viewState.card.status))}>
          {/* Card Visual with Ports */}
          <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-700/50">
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-sm text-muted-foreground">{viewState.card.name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  viewState.card.status === "ACTIVE"
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : "border-zinc-500/30 text-zinc-400"
                )}
              >
                {viewState.card.status}
              </Badge>
            </div>

            {/* Ports Grid - Visual Representation */}
            <div className="grid grid-cols-4 gap-4">
              {ports.map((port) => (
                <motion.div
                  key={port.erId}
                  whileHover={{ scale: 1.1 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 cursor-pointer"
                >
                  {/* Port Circle */}
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full shadow-lg flex items-center justify-center",
                      getPortColor(port.status)
                    )}
                  >
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  {/* Port Label */}
                  <span className="text-xs font-mono text-foreground">{port.name}</span>
                  <span className="text-[10px] text-muted-foreground">{port.status}</span>
                </motion.div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-xs text-muted-foreground">Retired</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-sky-400" />
                <span className="text-xs text-muted-foreground">Free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewState.level}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        {viewState.level === "container" && renderContainerView()}
        {viewState.level === "rack" && renderRackView()}
        {viewState.level === "shelf" && renderShelfView()}
        {viewState.level === "slot" && renderSlotView()}
        {viewState.level === "card" && renderCardView()}
        {viewState.level === "ports" && renderPortsView()}
      </motion.div>
    </AnimatePresence>
  )
}

// Main Resource Overview Component
export function ResourceOverview() {
  const [searchQuery, setSearchQuery] = useState(DEFAULT_SEARCH_PARAMS.equipmentName)
  const [category, setCategory] = useState<string>(DEFAULT_SEARCH_PARAMS.equipCategory.toLowerCase())
  const [searchResult, setSearchResult] = useState<EquipmentResponse | null>(null)
  const [selectedNode, setSelectedNode] = useState<EquipmentNode | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Removed auto-load - user must click Search button to fetch data

  const handleSearch = useCallback(async () => {
    const equipmentName = searchQuery.trim() || DEFAULT_SEARCH_PARAMS.equipmentName

    console.log("[v0] Search button clicked - Equipment:", equipmentName, "Category:", category)
    
    setIsSearching(true)
    setError(null)

    try {
      // Build search params - using hardcoded values for now
      const params: EquipmentSearchParams = {
        equipmentName,
        equipCategory: category === "all" ? DEFAULT_SEARCH_PARAMS.equipCategory : (category.toUpperCase() as "OLT" | "FDH" | "AP"),
        portInstId: DEFAULT_SEARCH_PARAMS.portInstId,
        equipInstId: DEFAULT_SEARCH_PARAMS.equipInstId,
      }

      console.log("[v0] Calling API with params:", params)

      // Call the API - do NOT use mock fallback, show actual errors
      const apiResponse = await fetchEquipmentHierarchy(params, false)
      
      console.log("[v0] API Response received:", apiResponse?.equipment?.name)
      
      // Convert to UI format
      const result = toEquipmentResponse(apiResponse)
      setSearchResult(result)
      setSelectedNode(result.equipment)
    } catch (err) {
      console.error("[v0] API Error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch equipment hierarchy")
      setSearchResult(null)
      setSelectedNode(null)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, category])

  const handleNodeSelect = (node: EquipmentNode) => {
    setSelectedNode(node)
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Equipment Search
            </CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase">
              ENV: {currentEnv}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by Equipment Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px] h-9">
                <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="olt">OLT</SelectItem>
                <SelectItem value="fdh">FDH</SelectItem>
                <SelectItem value="ap">Access Point</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isSearching} className="h-9">
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {isSearching ? (
        <Card className="rounded-xl border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Loading Equipment Hierarchy</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Fetching data from API...
            </p>
          </CardContent>
        </Card>
      ) : !searchResult ? (
        <Card className="rounded-xl border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-4">
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Search for Equipment</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Enter an equipment name above to search and explore the device hierarchy.
              Results will show the full structure from OLT/FDH down to individual ports.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hierarchy Tree Panel - Left Side */}
          <Card className="lg:col-span-4 rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Hierarchy</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto p-4">
                <HierarchyTreeNode
                  node={searchResult.equipment}
                  onSelect={handleNodeSelect}
                  selectedNode={selectedNode}
                />
              </div>

              {/* Summary Stats */}
              <div className="border-t border-border/50 p-4">
                <p className="text-xs text-muted-foreground mb-2">Summary</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(searchResult.summary.countsByType).map(([type, count]) => (
                    <div
                      key={type}
                      className="text-center p-2 rounded bg-secondary/30 border border-border/30"
                    >
                      <p className="text-sm font-bold text-foreground">{count}</p>
                      <p className="text-[10px] text-muted-foreground">{type}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device GUI Panel - Right Side */}
          <Card className="lg:col-span-8 rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Device Explorer</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceGUIPanel equipment={searchResult.equipment} selectedNode={selectedNode} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
