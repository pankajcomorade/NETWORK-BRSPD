"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  ChevronRight,
  Server,
  HardDrive,
  Layers,
  Box,
  CircuitBoard,
  Zap,
  Home,
  ChevronLeft,
  Maximize2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
// Status indicator
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
    maintenance: { label: "Maintenance", className: "bg-sky-500/15 text-sky-400 border-sky-500/50" },
  }
  const s = map[status]
  return <Badge variant="outline" className={cn("rounded-md text-xs font-medium", s.className)}>{s.label}</Badge>
}

// ==========================================
// Breadcrumb Navigation
// ==========================================
interface NavPath {
  level: string
  label: string
  id: string
  icon: React.ReactNode
}

function HierarchyBreadcrumb({ path, onNavigate }: { path: NavPath[]; onNavigate: (index: number) => void }) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-4 flex-wrap">
      {path.map((item, i) => (
        <div key={`${item.id}-${i}`} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <button
            onClick={() => onNavigate(i)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
              i === path.length - 1
                ? "bg-primary/15 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            {item.icon}
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        </div>
      ))}
    </nav>
  )
}

// ==========================================
// Tree Node Component
// ==========================================
interface TreeNodeProps {
  label: string
  status: DeviceStatus
  isSelected: boolean
  hasChildren: boolean
  isOpen: boolean
  onSelect: () => void
  onToggle: () => void
  icon: React.ReactNode
  depth: number
}

function HierarchyTreeNode({
  label,
  status,
  isSelected,
  hasChildren,
  isOpen,
  onSelect,
  onToggle,
  icon,
  depth,
  children,
}: TreeNodeProps & { children?: React.ReactNode }) {
  return (
    <div>
      <button
        onClick={() => {
          onSelect()
          if (hasChildren) onToggle()
        }}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
          isSelected ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        {hasChildren && (
          <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-90")} />
        )}
        {!hasChildren && <span className="w-4" />}
        <StatusDot status={status} />
        {icon}
        <span className="truncate flex-1">{label}</span>
      </button>
      {hasChildren && isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}

// ==========================================
// OLT Hierarchy Browser
// ==========================================
export function OLTHierarchyBrowser() {
  const [selectedOLT, setSelectedOLT] = useState<OLT | null>(sampleOLTs[0])
  const [expandedRacks, setExpandedRacks] = useState<Set<string>>(new Set(["rk-001"]))
  const [expandedShelves, setExpandedShelves] = useState<Set<string>>(new Set(["sf-001"]))
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set())
  const [selectedPath, setSelectedPath] = useState<NavPath[]>([
    { level: "olt", label: "Overview", id: "overview", icon: <Server className="h-4 w-4" /> },
  ])

  const toggleRack = (rackId: string) => {
    const newSet = new Set(expandedRacks)
    if (newSet.has(rackId)) newSet.delete(rackId)
    else newSet.add(rackId)
    setExpandedRacks(newSet)
  }

  const toggleShelf = (shelfId: string) => {
    const newSet = new Set(expandedShelves)
    if (newSet.has(shelfId)) newSet.delete(shelfId)
    else newSet.add(shelfId)
    setExpandedShelves(newSet)
  }

  const toggleSlot = (slotId: string) => {
    const newSet = new Set(expandedSlots)
    if (newSet.has(slotId)) newSet.delete(slotId)
    else newSet.add(slotId)
    setExpandedSlots(newSet)
  }

  const handleSelectRack = (rack: Rack) => {
    setSelectedPath([
      { level: "olt", label: selectedOLT?.name || "OLT", id: selectedOLT?.id || "", icon: <Server className="h-4 w-4" /> },
      { level: "rack", label: rack.name, id: rack.id, icon: <HardDrive className="h-4 w-4" /> },
    ])
  }

  const handleSelectShelf = (rack: Rack, shelf: Shelf) => {
    setSelectedPath([
      { level: "olt", label: selectedOLT?.name || "OLT", id: selectedOLT?.id || "", icon: <Server className="h-4 w-4" /> },
      { level: "rack", label: rack.name, id: rack.id, icon: <HardDrive className="h-4 w-4" /> },
      { level: "shelf", label: shelf.name, id: shelf.id, icon: <Layers className="h-4 w-4" /> },
    ])
  }

  const handleSelectSlot = (rack: Rack, shelf: Shelf, slot: Slot) => {
    setSelectedPath([
      { level: "olt", label: selectedOLT?.name || "OLT", id: selectedOLT?.id || "", icon: <Server className="h-4 w-4" /> },
      { level: "rack", label: rack.name, id: rack.id, icon: <HardDrive className="h-4 w-4" /> },
      { level: "shelf", label: shelf.name, id: shelf.id, icon: <Layers className="h-4 w-4" /> },
      { level: "slot", label: slot.name, id: slot.id, icon: <Box className="h-4 w-4" /> },
    ])
  }

  const handleSelectCard = (rack: Rack, shelf: Shelf, slot: Slot) => {
    if (slot.card) {
      setSelectedPath([
        { level: "olt", label: selectedOLT?.name || "OLT", id: selectedOLT?.id || "", icon: <Server className="h-4 w-4" /> },
        { level: "rack", label: rack.name, id: rack.id, icon: <HardDrive className="h-4 w-4" /> },
        { level: "shelf", label: shelf.name, id: shelf.id, icon: <Layers className="h-4 w-4" /> },
        { level: "slot", label: slot.name, id: slot.id, icon: <Box className="h-4 w-4" /> },
        { level: "card", label: slot.card.name, id: slot.card.id, icon: <CircuitBoard className="h-4 w-4" /> },
      ])
    }
  }

  const handleNavigate = (index: number) => {
    const newPath = selectedPath.slice(0, index + 1)
    setSelectedPath(newPath)
  }

  const currentItem = selectedPath[selectedPath.length - 1]

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Maximize2 className="h-5 w-5" />
            OLT Hierarchy Explorer
          </h2>
          <StatusBadge status={selectedOLT?.status || "active"} />
        </div>
        <p className="text-sm text-muted-foreground">Navigate through the container hierarchy: Rack → Shelf → Slot → Card → Port</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Tree Navigation */}
        <Card className="lg:col-span-1 border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Container Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-secondary/30 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Selected OLT</p>
              <p className="text-sm font-bold text-foreground">{selectedOLT?.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedOLT?.specification}</p>
            </div>

            {/* Rack Tree */}
            <div className="space-y-1">
              {selectedOLT?.racks.map((rack) => (
                <div key={rack.id}>
                  <HierarchyTreeNode
                    label={rack.name}
                    status={rack.status}
                    isSelected={currentItem?.id === rack.id}
                    hasChildren={rack.shelves.length > 0}
                    isOpen={expandedRacks.has(rack.id)}
                    onSelect={() => handleSelectRack(rack)}
                    onToggle={() => toggleRack(rack.id)}
                    icon={<HardDrive className="h-4 w-4" />}
                    depth={0}
                  >
                    {/* Shelf Tree */}
                    {rack.shelves.map((shelf) => (
                      <div key={shelf.id}>
                        <HierarchyTreeNode
                          label={shelf.name}
                          status={shelf.status}
                          isSelected={currentItem?.id === shelf.id}
                          hasChildren={shelf.slots.length > 0}
                          isOpen={expandedShelves.has(shelf.id)}
                          onSelect={() => handleSelectShelf(rack, shelf)}
                          onToggle={() => toggleShelf(shelf.id)}
                          icon={<Layers className="h-4 w-4" />}
                          depth={1}
                        >
                          {/* Slot Tree */}
                          {shelf.slots.map((slot) => (
                            <div key={slot.id}>
                              <HierarchyTreeNode
                                label={slot.name}
                                status={slot.status}
                                isSelected={currentItem?.id === slot.id}
                                hasChildren={!!slot.card}
                                isOpen={expandedSlots.has(slot.id)}
                                onSelect={() => handleSelectSlot(rack, shelf, slot)}
                                onToggle={() => toggleSlot(slot.id)}
                                icon={<Box className="h-4 w-4" />}
                                depth={2}
                              >
                                {/* Card */}
                                {slot.card && (
                                  <div>
                                    <HierarchyTreeNode
                                      label={slot.card.name}
                                      status={slot.card.status}
                                      isSelected={currentItem?.id === slot.card.id}
                                      hasChildren={slot.card.ports.length > 0}
                                      isOpen={expandedSlots.has(slot.card.id)}
                                      onSelect={() => handleSelectCard(rack, shelf, slot)}
                                      onToggle={() => toggleSlot(slot.card!.id)}
                                      icon={<CircuitBoard className="h-4 w-4" />}
                                      depth={3}
                                    >
                                      {/* Ports */}
                                      <div className="space-y-1">
                                        {slot.card.ports.map((port) => (
                                          <div
                                            key={port.id}
                                            className={cn(
                                              "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                                              currentItem?.id === port.id
                                                ? "bg-primary/20 text-primary font-medium"
                                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                            )}
                                            style={{ paddingLeft: "60px" }}
                                            onClick={() => {
                                              setSelectedPath([
                                                {
                                                  level: "olt",
                                                  label: selectedOLT?.name || "OLT",
                                                  id: selectedOLT?.id || "",
                                                  icon: <Server className="h-4 w-4" />,
                                                },
                                                { level: "rack", label: rack.name, id: rack.id, icon: <HardDrive className="h-4 w-4" /> },
                                                { level: "shelf", label: shelf.name, id: shelf.id, icon: <Layers className="h-4 w-4" /> },
                                                { level: "slot", label: slot.name, id: slot.id, icon: <Box className="h-4 w-4" /> },
                                                {
                                                  level: "card",
                                                  label: slot.card.name,
                                                  id: slot.card.id,
                                                  icon: <CircuitBoard className="h-4 w-4" />,
                                                },
                                                { level: "port", label: port.name, id: port.id, icon: <Zap className="h-3 w-3" /> },
                                              ])
                                            }}
                                          >
                                            <StatusDot status={port.status} />
                                            <Zap className="h-3 w-3" />
                                            <span>{port.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </HierarchyTreeNode>
                                  </div>
                                )}
                              </HierarchyTreeNode>
                            </div>
                          ))}
                        </HierarchyTreeNode>
                      </div>
                    ))}
                  </HierarchyTreeNode>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Details */}
        <Card className="lg:col-span-2 border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <HierarchyBreadcrumb path={selectedPath} onNavigate={handleNavigate} />
            <CardTitle className="text-xl capitalize">{currentItem?.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overview */}
            {currentItem?.level === "olt" && selectedOLT && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase">Model</p>
                    <p className="font-semibold">{selectedOLT.specification}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase">Status</p>
                    <StatusBadge status={selectedOLT.status} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase">Total Racks</p>
                    <p className="font-semibold text-lg">{selectedOLT.racks.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase">Network Status</p>
                    <p className="font-semibold">{selectedOLT.networkStatus}</p>
                  </div>
                </div>
                <div className="border-t border-border/30 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{selectedOLT.createDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{selectedOLT.lastUpdatedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By:</span>
                    <span>{selectedOLT.createdBy}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rack Details */}
            {currentItem?.level === "rack" && selectedOLT && (
              <div className="space-y-4">
                {selectedOLT.racks
                  .filter((r) => r.id === currentItem.id)
                  .map((rack) => (
                    <div key={rack.id}>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase">Rack ID</p>
                          <p className="font-semibold">{rack.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase">Status</p>
                          <StatusBadge status={rack.status} />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Shelves</p>
                        <div className="space-y-2">
                          {rack.shelves.map((shelf) => (
                            <div key={shelf.id} className="bg-secondary/30 rounded-lg p-3 text-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{shelf.name}</span>
                                <StatusDot status={shelf.status} />
                              </div>
                              <p className="text-xs text-muted-foreground">{shelf.slots.length} Slots</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Shelf Details */}
            {currentItem?.level === "shelf" && selectedOLT && (
              <div className="space-y-4">
                {selectedOLT.racks
                  .flatMap((r) =>
                    r.shelves
                      .filter((s) => s.id === currentItem.id)
                      .map((shelf) => ({ shelf, rack: r }))
                  )
                  .map(({ shelf }) => (
                    <div key={shelf.id}>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase">Shelf ID</p>
                          <p className="font-semibold">{shelf.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase">Status</p>
                          <StatusBadge status={shelf.status} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Slots</p>
                        <div className="space-y-2">
                          {shelf.slots.map((slot) => (
                            <div key={slot.id} className="bg-secondary/30 rounded-lg p-3 text-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{slot.name}</span>
                                  {slot.card && <p className="text-xs text-muted-foreground mt-1">{slot.card.type}</p>}
                                </div>
                                <StatusDot status={slot.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Slot Details */}
            {currentItem?.level === "slot" && selectedOLT && (
              <div className="space-y-4">
                {selectedOLT.racks
                  .flatMap((r) =>
                    r.shelves.flatMap((s) =>
                      s.slots
                        .filter((sl) => sl.id === currentItem.id)
                        .map((slot) => ({ slot, rack: r, shelf: s }))
                    )
                  )
                  .map(({ slot }) => (
                    <div key={slot.id}>
                      {slot.card ? (
                        <>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase">Slot ID</p>
                              <p className="font-semibold">{slot.name}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase">Card Type</p>
                              <p className="font-semibold">{slot.card.type}</p>
                            </div>
                          </div>
                          <div className="bg-secondary/30 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">{slot.card.name}</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Ports</p>
                                <p className="font-semibold">{slot.card.ports.length}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <StatusBadge status={slot.card.status} />
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-secondary/20 rounded-lg p-6 text-center text-sm text-muted-foreground">Empty Slot</div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Card Details */}
            {currentItem?.level === "card" && selectedOLT && (
              <div className="space-y-4">
                {selectedOLT.racks
                  .flatMap((r) =>
                    r.shelves.flatMap((s) =>
                      s.slots
                        .filter((sl) => sl.card?.id === currentItem.id)
                        .map((slot) => ({ card: slot.card!, rack: r, shelf: s, slot }))
                    )
                  )
                  .map(({ card }) => (
                    <div key={card.id} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase">Card ID</p>
                          <p className="font-semibold">{card.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase">Type</p>
                          <p className="font-semibold text-sm">{card.type}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase">Status</p>
                          <StatusBadge status={card.status} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Ports ({card.ports.length})</p>
                        <div className="grid grid-cols-2 gap-2">
                          {card.ports.map((port) => (
                            <div key={port.id} className="bg-secondary/30 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono font-semibold text-sm">{port.name}</span>
                                <StatusDot status={port.status} />
                              </div>
                              <p className="text-xs text-muted-foreground capitalize">{port.type}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Port Details */}
            {currentItem?.level === "port" && selectedOLT && (
              <div className="space-y-4">
                {selectedOLT.racks
                  .flatMap((r) =>
                    r.shelves.flatMap((s) =>
                      s.slots.flatMap((sl) =>
                        sl.card?.ports
                          .filter((p) => p.id === currentItem.id)
                          .map((port) => ({ port, card: sl.card!, rack: r, shelf: s, slot: sl })) || []
                      )
                    )
                  )
                  .map(({ port, card, rack, shelf, slot }) => (
                    <div key={port.id}>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase">Port</p>
                          <p className="font-mono font-semibold text-lg">{port.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase">Status</p>
                          <StatusBadge status={port.status} />
                        </div>
                      </div>
                      <div className="border-t border-border/30 pt-4 space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Port Details</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Type:</span>
                              <span className="capitalize">{port.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Card:</span>
                              <span>{card.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Slot:</span>
                              <span>{slot.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Shelf:</span>
                              <span>{shelf.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rack:</span>
                              <span>{rack.name}</span>
                            </div>
                          </div>
                        </div>
                        {port.connectedTo && (
                          <div className="bg-primary/10 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Connected To</p>
                            <p className="text-sm font-medium text-primary">{port.connectedTo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
