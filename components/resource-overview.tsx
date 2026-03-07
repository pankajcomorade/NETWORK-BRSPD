"use client"

import { useState, useCallback } from "react"
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

// Types based on API response structure
interface EquipmentNode {
  name: string
  type: "OLT" | "FDH" | "AP" | "RACK" | "SHELF" | "SLOT" | "NETWORKCARD" | "PORT"
  instanceID: number | null
  erId: string
  status: "ACTIVE" | "INACTIVE" | "WARNING" | "MAINTENANCE"
  nodes: EquipmentNode[]
}

interface EquipmentResponse {
  equipment: EquipmentNode
  summary: {
    countsByType: Record<string, number>
    totalNodes: number
  }
}

// Sample API response data
const sampleApiResponse: EquipmentResponse = {
  equipment: {
    name: "BUFTNCXAH07",
    type: "OLT",
    instanceID: 197670,
    erId: "200117",
    status: "ACTIVE",
    nodes: [
      {
        name: "RK=001",
        type: "RACK",
        instanceID: null,
        erId: "200118",
        status: "ACTIVE",
        nodes: [
          {
            name: "SF=001",
            type: "SHELF",
            instanceID: null,
            erId: "200119",
            status: "ACTIVE",
            nodes: [
              {
                name: "SL=001",
                type: "SLOT",
                instanceID: null,
                erId: "200120",
                status: "ACTIVE",
                nodes: [
                  {
                    name: "NC=001",
                    type: "NETWORKCARD",
                    instanceID: null,
                    erId: "200121",
                    status: "ACTIVE",
                    nodes: [
                      { name: "PP=001", type: "PORT", instanceID: 197873, erId: "200194", status: "ACTIVE", nodes: [] },
                      { name: "PP=002", type: "PORT", instanceID: 197875, erId: "200236", status: "ACTIVE", nodes: [] },
                      { name: "PP=003", type: "PORT", instanceID: 197887, erId: "200440", status: "ACTIVE", nodes: [] },
                      { name: "PP=004", type: "PORT", instanceID: 197874, erId: "200207", status: "INACTIVE", nodes: [] },
                      { name: "PP=005", type: "PORT", instanceID: 197884, erId: "200356", status: "ACTIVE", nodes: [] },
                      { name: "PP=006", type: "PORT", instanceID: 197867, erId: "200122", status: "WARNING", nodes: [] },
                    ],
                  },
                ],
              },
              {
                name: "SL=002",
                type: "SLOT",
                instanceID: null,
                erId: "200130",
                status: "ACTIVE",
                nodes: [
                  {
                    name: "NC=002",
                    type: "NETWORKCARD",
                    instanceID: null,
                    erId: "200131",
                    status: "ACTIVE",
                    nodes: [
                      { name: "PP=001", type: "PORT", instanceID: 197900, erId: "200300", status: "ACTIVE", nodes: [] },
                      { name: "PP=002", type: "PORT", instanceID: 197901, erId: "200301", status: "ACTIVE", nodes: [] },
                      { name: "PP=003", type: "PORT", instanceID: 197902, erId: "200302", status: "INACTIVE", nodes: [] },
                      { name: "PP=004", type: "PORT", instanceID: 197903, erId: "200303", status: "ACTIVE", nodes: [] },
                    ],
                  },
                ],
              },
              {
                name: "SL=003",
                type: "SLOT",
                instanceID: null,
                erId: "200140",
                status: "INACTIVE",
                nodes: [],
              },
              {
                name: "SL=004",
                type: "SLOT",
                instanceID: null,
                erId: "200150",
                status: "INACTIVE",
                nodes: [],
              },
            ],
          },
          {
            name: "SF=002",
            type: "SHELF",
            instanceID: null,
            erId: "200200",
            status: "ACTIVE",
            nodes: [
              {
                name: "SL=001",
                type: "SLOT",
                instanceID: null,
                erId: "200201",
                status: "ACTIVE",
                nodes: [
                  {
                    name: "NC=001",
                    type: "NETWORKCARD",
                    instanceID: null,
                    erId: "200202",
                    status: "ACTIVE",
                    nodes: [
                      { name: "PP=001", type: "PORT", instanceID: 198000, erId: "200400", status: "ACTIVE", nodes: [] },
                      { name: "PP=002", type: "PORT", instanceID: 198001, erId: "200401", status: "WARNING", nodes: [] },
                      { name: "PP=003", type: "PORT", instanceID: 198002, erId: "200402", status: "ACTIVE", nodes: [] },
                      { name: "PP=004", type: "PORT", instanceID: 198003, erId: "200403", status: "ACTIVE", nodes: [] },
                    ],
                  },
                ],
              },
              {
                name: "SL=002",
                type: "SLOT",
                instanceID: null,
                erId: "200210",
                status: "INACTIVE",
                nodes: [],
              },
              {
                name: "SL=003",
                type: "SLOT",
                instanceID: null,
                erId: "200220",
                status: "INACTIVE",
                nodes: [],
              },
              {
                name: "SL=004",
                type: "SLOT",
                instanceID: null,
                erId: "200230",
                status: "INACTIVE",
                nodes: [],
              },
            ],
          },
        ],
      },
    ],
  },
  summary: {
    countsByType: { OLT: 1, RACK: 1, SHELF: 2, SLOT: 8, NETWORKCARD: 4, PORT: 14 },
    totalNodes: 30,
  },
}

// Get icon for node type
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
      return CircuitBoard
    case "PORT":
      return Zap
    default:
      return Server
  }
}

// Get status color
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

const getStatusBorder = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-500/50"
    case "INACTIVE":
      return "border-zinc-500/30"
    case "WARNING":
      return "border-amber-500/50"
    case "MAINTENANCE":
      return "border-sky-500/50"
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

  const navigateToPorts = (shelf: EquipmentNode, slot: EquipmentNode, card: EquipmentNode, rack: EquipmentNode) => {
    setViewState({ level: "ports", rack, shelf, slot, card })
  }

  const goBack = () => {
    if (viewState.level === "ports") {
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
                            "p-2 rounded border text-center text-xs",
                            shelf.status === "ACTIVE"
                              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                              : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
                          )}
                        >
                          {shelf.name.replace("SF=", "SH")}
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

  // Render Rack View (shelves inside rack)
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
            <p className="text-sm text-muted-foreground">Click on a Shelf to view slots</p>
          </div>
        </div>

        <div className={cn("rounded-xl border-2 bg-card p-6 max-w-2xl mx-auto", getStatusBorder(viewState.rack.status))}>
          <div className="space-y-4">
            {shelves.map((shelf) => (
              <motion.button
                key={shelf.erId}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigateToShelf(shelf, viewState.rack!)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left",
                  "bg-secondary/30 hover:bg-secondary/50",
                  getStatusBorder(shelf.status)
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{shelf.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      shelf.status === "ACTIVE"
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : "border-zinc-500/30 text-zinc-400"
                    )}
                  >
                    {shelf.status}
                  </Badge>
                </div>

                {/* Slots Preview Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {shelf.nodes
                    .filter((n) => n.type === "SLOT")
                    .map((slot) => {
                      const hasCard = slot.nodes.some((n) => n.type === "NETWORKCARD")
                      return (
                        <div
                          key={slot.erId}
                          className={cn(
                            "p-2 rounded border text-center text-xs font-mono",
                            hasCard
                              ? slot.status === "ACTIVE"
                                ? "bg-emerald-500/30 border-emerald-500/40 text-emerald-300"
                                : "bg-amber-500/20 border-amber-500/30 text-amber-300"
                              : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500"
                          )}
                        >
                          {slot.name.replace("SL=", "SF")}
                        </div>
                      )
                    })}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render Shelf View (slots with cards)
  const renderShelfView = () => {
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
            <p className="text-sm text-muted-foreground">Click on a Card to view ports</p>
          </div>
        </div>

        <div className={cn("rounded-xl border-2 bg-card p-6 max-w-3xl mx-auto", getStatusBorder(viewState.shelf.status))}>
          <div className="grid grid-cols-4 gap-4">
            {slots.map((slot) => {
              const card = slot.nodes.find((n) => n.type === "NETWORKCARD")
              const hasCard = !!card

              return (
                <motion.button
                  key={slot.erId}
                  whileHover={hasCard ? { scale: 1.05 } : {}}
                  whileTap={hasCard ? { scale: 0.95 } : {}}
                  onClick={() => {
                    if (hasCard && card) {
                      navigateToPorts(viewState.shelf!, slot, card, viewState.rack!)
                    }
                  }}
                  disabled={!hasCard}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    hasCard
                      ? cn(
                          "bg-secondary/30 hover:bg-secondary/50 cursor-pointer",
                          getStatusBorder(slot.status)
                        )
                      : "bg-zinc-900/30 border-zinc-800/50 cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="text-center">
                    <Box className={cn("h-8 w-8 mx-auto mb-2", hasCard ? "text-primary" : "text-zinc-600")} />
                    <p className="font-mono text-sm text-foreground">{slot.name.replace("SL=", "SF")}</p>
                    {hasCard && card && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {card.nodes.length} ports
                      </p>
                    )}
                    {!hasCard && (
                      <p className="text-xs text-zinc-600 mt-1">Empty</p>
                    )}
                  </div>
                </motion.button>
              )
            })}
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
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-zinc-700/50">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-zinc-600" />
                <span className="text-xs text-muted-foreground">Inactive</span>
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
        {viewState.level === "ports" && renderPortsView()}
      </motion.div>
    </AnimatePresence>
  )
}

// Main Resource Overview Component
export function ResourceOverview() {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [searchResult, setSearchResult] = useState<EquipmentResponse | null>(null)
  const [selectedNode, setSelectedNode] = useState<EquipmentNode | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    // Simulate API call - replace with actual API integration
    setTimeout(() => {
      setSearchResult(sampleApiResponse)
      setSelectedNode(sampleApiResponse.equipment)
      setIsSearching(false)
    }, 500)
  }, [searchQuery])

  const handleNodeSelect = (node: EquipmentNode) => {
    setSelectedNode(node)
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Equipment Search
          </CardTitle>
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
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {!searchResult ? (
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
