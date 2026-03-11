"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight, Server, HardDrive, Layers, Box, CircuitBoard, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type OLT, type Rack, type Shelf, type Slot, type NetworkCard, type Port, type DeviceStatus, sampleOLTs } from "@/lib/network-data"

// Status indicator
function StatusDot({ status }: { status: DeviceStatus }) {
  const colorMap: Record<DeviceStatus, string> = {
    active: "bg-emerald-500",
    inactive: "bg-zinc-400",
    warning: "bg-amber-500",
    maintenance: "bg-sky-500",
  }
  return <span className={cn("inline-block h-2 w-2 rounded-full", colorMap[status])} />
}

function StatusBadge({ status }: { status: DeviceStatus }) {
  const map: Record<DeviceStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    inactive: { label: "Inactive", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
    warning: { label: "Warning", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    maintenance: { label: "Maintenance", className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  }
  const s = map[status]
  return <Badge variant="outline" className={cn("text-xs font-medium", s.className)}>{s.label}</Badge>
}

// Expandable section with smooth animation
function ExpandableSection({
  title,
  icon: Icon,
  status,
  isOpen,
  onToggle,
  children,
  count,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  status: DeviceStatus
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  count?: number
}) {
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-card/50 hover:bg-card/70 transition-colors">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary/5 transition-colors group"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        </motion.div>
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 text-left text-sm font-medium">{title}</span>
        <StatusDot status={status} />
        {count && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{count}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/30 bg-secondary/30"
          >
            <div className="p-3 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Port display
function PortDisplay({ port }: { port: Port }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-card/60 rounded border border-border/30 text-xs">
      <StatusDot status={port.status} />
      <span className="font-mono font-medium text-foreground">{port.name}</span>
      <span className="text-muted-foreground ml-auto text-xs">{port.type}</span>
    </div>
  )
}

// Card section
function CardSection({ card }: { card: NetworkCard }) {
  const [isOpen, setIsOpen] = useState(false)
  const activePorts = card.ports.filter(p => p.status === "active").length

  return (
    <ExpandableSection
      title={card.name}
      icon={CircuitBoard}
      status={card.status}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      count={card.ports.length}
    >
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        <div className="px-2 py-1.5 bg-card rounded border border-border/20 text-xs text-muted-foreground">
          {card.type} • {activePorts}/{card.ports.length} active
        </div>
        {card.ports.map(port => (
          <PortDisplay key={port.id} port={port} />
        ))}
      </div>
    </ExpandableSection>
  )
}

// Slot section
function SlotSection({ slot }: { slot: Slot }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasCard = !!slot.card

  return (
    <ExpandableSection
      title={slot.name}
      icon={Box}
      status={slot.status}
      isOpen={isOpen && hasCard}
      onToggle={() => hasCard && setIsOpen(!isOpen)}
      count={hasCard ? 1 : 0}
    >
      {hasCard ? (
        <CardSection card={slot.card} />
      ) : (
        <div className="px-3 py-2 text-xs text-muted-foreground italic">Empty slot</div>
      )}
    </ExpandableSection>
  )
}

// Shelf section
function ShelfSection({ shelf }: { shelf: Shelf }) {
  const [isOpen, setIsOpen] = useState(false)
  const activeSlots = shelf.slots.filter(s => s.card).length

  return (
    <ExpandableSection
      title={shelf.name}
      icon={Layers}
      status={shelf.status}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      count={shelf.slots.length}
    >
      <div className="space-y-2">
        {shelf.slots.map(slot => (
          <SlotSection key={slot.id} slot={slot} />
        ))}
      </div>
    </ExpandableSection>
  )
}

// Rack section
function RackSection({ rack }: { rack: Rack }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ExpandableSection
      title={rack.name}
      icon={HardDrive}
      status={rack.status}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      count={rack.shelves.length}
    >
      <div className="space-y-2">
        {rack.shelves.map(shelf => (
          <ShelfSection key={shelf.id} shelf={shelf} />
        ))}
      </div>
    </ExpandableSection>
  )
}

// Main OLT Container explorer
function OLTExplorer({ olt }: { olt: OLT }) {
  const [expandedRack, setExpandedRack] = useState<string | null>(null)
  const totalPorts = olt.racks.reduce((sum, rack) => sum + rack.shelves.reduce((sSum, shelf) => sSum + shelf.slots.filter(s => s.card).reduce((slSum, slot) => slSum + (slot.card?.ports.length || 0), 0), 0), 0)
  const activePorts = olt.racks.reduce((sum, rack) => sum + rack.shelves.reduce((sSum, shelf) => sSum + shelf.slots.filter(s => s.card).reduce((slSum, slot) => slSum + (slot.card?.ports.filter(p => p.status === "active").length || 0), 0), 0), 0)

  return (
    <div className="space-y-6">
      {/* OLT Header */}
      <Card className="border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Server className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{olt.name}</CardTitle>
                <StatusBadge status={olt.status} />
              </div>
              <p className="text-sm text-muted-foreground">{olt.specification}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{activePorts}</div>
              <p className="text-xs text-muted-foreground">Active ports</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground grid grid-cols-2 gap-3">
          <div>
            <span className="font-medium text-foreground">{totalPorts}</span> total ports
          </div>
          <div>
            <span className="font-medium text-foreground">{olt.racks.length}</span> racks
          </div>
          <div className="col-span-2">Last updated: {olt.lastUpdatedDate}</div>
        </CardContent>
      </Card>

      {/* Racks Explorer */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          Rack Structure
        </h3>
        <div className="space-y-2">
          {olt.racks.map(rack => (
            <RackSection key={rack.id} rack={rack} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Cabinet Explorer Component
export function CabinetExplorer() {
  const [selectedOlt, setSelectedOlt] = useState(sampleOLTs[0])

  return (
    <div className="space-y-6">
      {/* OLT Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sampleOLTs.map(olt => (
          <Button
            key={olt.id}
            variant={selectedOlt.id === olt.id ? "default" : "outline"}
            onClick={() => setSelectedOlt(olt)}
            className="whitespace-nowrap"
          >
            {olt.name}
          </Button>
        ))}
      </div>

      {/* Explorer */}
      <OLTExplorer olt={selectedOlt} />
    </div>
  )
}
