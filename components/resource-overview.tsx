"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Filter,
  Server,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Search,
  HardDrive,
  Layers,
  Box,
  Cpu,
  Zap,
  Plus,
  Pencil,
  Trash2,
  Copy,
  FileUp,
  FileDown,
  X,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { EquipmentTypeaheadSearch } from "@/components/equipment-typeahead-search"
import { getEquipmentIcon } from "@/lib/equipment-icons"

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

// Tab System Types
type TabType = "search" | "new" | "edit" | "add-child" | "add-sibling"

interface TabData {
  id: string
  title: string
  type: TabType
  closable: boolean
  context?: {
    node: EquipmentNode | null
    type?: "child" | "sibling"
  }
}

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
      return Cpu
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
    case "FREE":
      return "bg-green-500"
    case "BUSY":
      return "bg-red-500"
    case "PENDING":
      return "bg-yellow-400"
    case "RETIRED":
      return "bg-blue-500"
    // legacy fallbacks
    case "ACTIVE":
      return "bg-red-500"
    case "INACTIVE":
      return "bg-zinc-400"
    default:
      return "bg-zinc-400"
  }
}

const isPortClickable = (status: string) => {
  return false
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
  onAdd,
  onEdit,
  onRemove,
}: {
  node: EquipmentNode
  depth?: number
  onSelect: (node: EquipmentNode) => void
  selectedNode: EquipmentNode | null
  onAdd?: (node: EquipmentNode, type: "child" | "sibling") => void
  onEdit?: (node: EquipmentNode) => void
  onRemove?: (node: EquipmentNode) => void
}) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const Icon = getNodeIcon(node.type)
  const hasChildren = node.nodes && node.nodes.length > 0
  const isSelected = selectedNode?.erId === node.erId

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (hasChildren) setIsOpen(!isOpen)
              onSelect(node)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (hasChildren) setIsOpen(!isOpen)
                onSelect(node)
              }
            }}
            className={cn(
              "flex w-full items-center gap-1.5 py-1 px-1.5 rounded-md text-xs transition-colors hover:bg-secondary/50 group cursor-pointer outline-none",
              isSelected && "bg-primary/10 text-primary"
            )}
            style={{ paddingLeft: `${depth * 12 + 6}px` }}
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
            <span className={cn("truncate flex-1 text-left text-[10px]", isSelected ? "text-primary font-medium" : "text-foreground")}>
              {node.name}
            </span>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">Add</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAdd?.(node, "child"); }}>
                    <Layers className="mr-2 h-4 w-4" />
                    <span>child</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAdd?.(node, "sibling"); }}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    <span>Sibling</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-primary/10 hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); onEdit?.(node); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onRemove?.(node); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-primary/10 hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); console.log("Copy", node.name); }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Copy</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-primary/10 hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); console.log("Import", node.name); }}
                  >
                    <FileUp className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Import</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-primary/10 hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); console.log("Export", node.name); }}
                  >
                    <FileDown className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Export</TooltipContent>
              </Tooltip>


            </div>

            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 h-4 border-border/50 text-muted-foreground shrink-0 group-hover:hidden"
            >
              {node.type}
            </Badge>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">

          <ContextMenuItem onClick={() => onAdd?.(node, "child")}>
            <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Add Child</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onAdd?.(node, "sibling")}>
            <GitBranch className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Add Sibling</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onEdit?.(node)}>
            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Edit Node</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => console.log("Delete", node.name)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => console.log("Copy", node.name)}>
            <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Copy</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => console.log("Import", node.name)}>
            <FileUp className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Import</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => console.log("Export", node.name)}>
            <FileDown className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Export</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {hasChildren && isOpen && (
        <div>
          {node.nodes.map((child) => (
            <HierarchyTreeNode
              key={child.erId}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedNode={selectedNode}
              onAdd={onAdd}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}


// Device GUI View Types
type GUIViewLevel = "container" | "rack" | "shelf" | "slot" | "card" | "splitter" | "ports"

interface GUIViewState {
  level: GUIViewLevel
  rack?: EquipmentNode
  shelf?: EquipmentNode
  slot?: EquipmentNode
  card?: EquipmentNode
}

// Equipment Type options for adding new nodes
const EQUIPMENT_TYPES = [
  "OLT", "FDH", "AP", "RACK", "SHELF", "SLOT", "NETWORK CARD", "PORT", "SPLITTER", "SPLITTER LEG"
]

// Recursive component for editing/building hierarchy within the modal
function EditableHierarchyNode({
  node,
  onUpdate,
  onAddChild,
  onRemove,
  depth = 0
}: {
  node: EquipmentNode
  onUpdate: (updatedNode: EquipmentNode) => void
  onAddChild: (parentNode: EquipmentNode) => void
  onRemove: (node: EquipmentNode) => void
  depth?: number
}) {
  const Icon = getNodeIcon(node.type)

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 p-1.5 rounded-md border border-border/50 bg-secondary/5"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Input
          value={node.name}
          onChange={(e) => onUpdate({ ...node, name: e.target.value })}
          className="h-6 py-0 text-[9px] flex-1"
          placeholder="Node Name"
        />
        <Select
          value={node.type}
          onValueChange={(val) => onUpdate({ ...node, type: val as any })}
        >
          <SelectTrigger className="h-6 w-24 text-[9px] px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EQUIPMENT_TYPES.map(t => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-primary hover:bg-primary/10"
            onClick={() => onAddChild(node)}
          >
            <Plus className="h-3 w-3" />
          </Button>
          {depth > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(node)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      {node.nodes && node.nodes.map((child, idx) => (
        <EditableHierarchyNode
          key={child.erId || idx}
          node={child}
          onUpdate={(updatedChild) => {
            const newNodes = [...node.nodes]
            newNodes[idx] = updatedChild
            onUpdate({ ...node, nodes: newNodes })
          }}
          onAddChild={onAddChild}
          onRemove={(childToRemove) => {
            onUpdate({
              ...node,
              nodes: node.nodes.filter(n => n.erId !== childToRemove.erId)
            })
          }}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

function EquipmentHierarchyDialog({
  isOpen,
  onOpenChange,
  mode,
  context,
  onSave
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  context: { node: EquipmentNode | null; type?: "parent" | "sibling" }
  onSave: (node: EquipmentNode) => void
}) {
  const [tempHierarchy, setTempHierarchy] = useState<EquipmentNode | null>(null)
  const [newType, setNewType] = useState<string>("RACK")

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && context.node) {
        setTempHierarchy(JSON.parse(JSON.stringify(context.node)))
      } else if (mode === "add") {
        // Initial new node based on context
        const newNode: EquipmentNode = {
          name: "New Equipment",
          type: "RACK",
          instanceID: null,
          erId: "new-" + Date.now(),
          status: "ACTIVE",
          nodes: []
        }
        setTempHierarchy(newNode)
      }
    } else {
      setTempHierarchy(null)
    }
  }, [isOpen, mode, context])

  const handleAddChild = (parentNode: EquipmentNode) => {
    if (!tempHierarchy) return

    const newNode: EquipmentNode = {
      name: `New ${newType}`,
      type: newType as any,
      instanceID: null,
      erId: "new-" + Date.now(),
      status: "ACTIVE",
      nodes: []
    }

    const updateRecursive = (current: EquipmentNode): EquipmentNode => {
      if (current.erId === parentNode.erId) {
        return { ...current, nodes: [...current.nodes, newNode] }
      }
      return { ...current, nodes: current.nodes.map(updateRecursive) }
    }

    setTempHierarchy(updateRecursive(tempHierarchy))
  }

  if (!tempHierarchy) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "add" ? (
              <>
                <Plus className="h-5 w-5 text-primary" />
                Add New Equipment ({context.type})
              </>
            ) : (
              <>
                <Pencil className="h-5 w-5 text-primary" />
                Edit Equipment Hierarchy
              </>
            )}
          </DialogTitle>
          <div className="text-xs text-muted-foreground px-1">
            {mode === "add"
              ? `Adding new ${context.type} relative to ${context.node?.name}`
              : `Editing hierarchy starting from ${context.node?.name}`}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
          <div className="flex items-center gap-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="space-y-1 flex-1">
              <Label className="text-xs font-semibold">Equipment Type to Add</Label>
              <p className="text-[10px] text-muted-foreground">Select type for when you click the + icon below</p>
            </div>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg p-4 bg-background/50">
            <EditableHierarchyNode
              node={tempHierarchy}
              onUpdate={setTempHierarchy}
              onAddChild={handleAddChild}
              onRemove={() => { }} // Root cannot be removed in this view
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(tempHierarchy); onOpenChange(false); }}>
            {mode === "add" ? "Create Equipment" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Device GUIPanel Component
function DeviceGUIPanel({
  equipment,
  selectedNode,
}: {
  equipment: EquipmentNode
  selectedNode: EquipmentNode | null
}) {
  const [viewState, setViewState] = useState<GUIViewState>({ level: "container" })
  const [showHierarchy, setShowHierarchy] = useState(true)
  const [showSummary, setShowSummary] = useState(true)
  const [selectedOlt, setSelectedOlt] = useState<EquipmentNode | null>(null)
  const [showOltDialog, setShowOltDialog] = useState(false)

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
    setViewState({
      level: "card",
      rack,
      shelf,
      slot,
      card,
    })
  }

  const navigateToSplitter = (splitter: EquipmentNode, slot: EquipmentNode, shelf: EquipmentNode, rack: EquipmentNode) => {
    setViewState({
      level: "splitter",
      rack,
      shelf,
      slot,
      card: splitter,
    })
  }

  const navigateToPorts = (shelf: EquipmentNode, slot: EquipmentNode, card: EquipmentNode, rack: EquipmentNode) => {
    setViewState({ level: "ports", rack, shelf, slot, card })
  }

  const goBack = () => {
    if (viewState.level === "ports") {
      setViewState({ level: "card", rack: viewState.rack, shelf: viewState.shelf, slot: viewState.slot, card: viewState.card })
    } else if (viewState.level === "splitter") {
      setViewState({ level: "slot", rack: viewState.rack, shelf: viewState.shelf, slot: viewState.slot })
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
      <div className="space-y-2">
        <div className="text-center mb-3">
          <button
            onClick={() => {
              setSelectedOlt(equipment)
              setShowOltDialog(true)
            }}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-foreground">{equipment.name}</h3>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </button>
        </div>

        {/* OLT Device Visual */}
        <div className="relative mx-auto max-w-2xl">
          <div className={cn("rounded-lg border-2 bg-card p-3", getStatusBorder(equipment.status))}>
            {/* Device Header */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
              <div className="w-24 h-2 rounded bg-sky-500" />
              <span className="font-mono text-sm text-muted-foreground">CALIX E7-20 OLT</span>
            </div>

            {/* Racks Grid */}
            <div className="grid grid-cols-1 gap-2">
              {racks.map((rack) => (
                <motion.button
                  key={rack.erId}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigateToRack(rack)}
                  className={cn(
                    "p-2 rounded-lg border-2 transition-all text-left text-sm",
                    "bg-secondary/30 hover:bg-secondary/50",
                    getStatusBorder(rack.status)
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-foreground">{rack.name}</span>
                    </div>
                    <div className={cn("h-2 w-2 rounded-full", getStatusColor(rack.status))} />
                  </div>

                  {/* Shelves Preview */}
                  <div className="grid grid-cols-4 gap-1">
                    {rack.nodes
                      .filter((n) => n.type === "SHELF")
                      .map((shelf) => (
                        <div
                          key={shelf.erId}
                          className={cn(
                            "p-1 rounded border text-[10px] font-mono text-center",
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
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <div className="h-2 w-2 rounded-full bg-sky-500" />
                <div className="h-2 w-2 rounded-full bg-zinc-600" />
                <div className="h-2 w-2 rounded-full bg-zinc-600" />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">PWR | SYS | ALM | ACT</span>
            </div>

            <div className="mt-1 text-[9px] text-muted-foreground font-mono">
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
        <div className="flex items-center gap-1 mb-4">
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
                <div className="grid grid-cols-4 gap-1">
                  {slots.map((slot) => {
                    const card = slot.nodes.find((n) => n.type === "NETWORKCARD" || n.type === "NETWORK CARD")
                    const splitter = slot.nodes.find((n) => n.type === "SPLITTER")
                    const component = card || splitter
                    const hasComponent = !!component
                    return (
                      <motion.button
                        key={slot.erId}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigateToSlot(slot, shelf, viewState.rack!)}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all text-center",
                          "bg-card hover:bg-secondary/50",
                          hasComponent
                            ? "border-primary/40 hover:border-primary/70"
                            : "border-border/50 hover:border-border"
                        )}
                      >
                        <Box
                          className={cn(
                            "h-8 w-8 mx-auto mb-2",
                            hasComponent ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <p className="font-mono text-sm font-semibold text-foreground">{slot.name}</p>
                        {hasComponent && component ? (
                          <p className="text-xs text-primary mt-1">{component.name}</p>
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
        <div className="flex items-center gap-1 mb-4">
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
              const splitter = slot.nodes.find((n) => n.type === "SPLITTER")
              const component = card || splitter
              const hasComponent = !!component
              const label = card ? card.name : splitter ? splitter.name : null
              return (
                <motion.button
                  key={slot.erId}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToSlot(slot, viewState.shelf!, viewState.rack!)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all cursor-pointer text-center flex flex-col",
                    "bg-card hover:bg-secondary/50",
                    hasComponent ? "border-primary/40 hover:border-primary/70" : "border-border/50"
                  )}
                >
                  <Box className={cn("h-8 w-8 mx-auto mb-2", hasComponent ? "text-primary" : "text-muted-foreground")} />
                  <p className="font-mono text-sm font-semibold text-foreground">{slot.name}</p>
                  {hasComponent && label ? (
                    <div className="mt-1">
                      <p className="text-xs text-primary">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {card && `${card.nodes.filter((n) => n.type === "PORT").length} Ports`}
                        {splitter && `${splitter.nodes.filter((n) => n.type === "SPLITTER LEG").length} Legs`}
                      </p>
                    </div>
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

  // Render Slot View - Show Network Card or Splitter inside the slot
  const renderSlotView = () => {
    if (!viewState.slot || !viewState.shelf || !viewState.rack) return null
    const card = viewState.slot.nodes.find((n) => n.type === "NETWORKCARD" || n.type === "NETWORK CARD")
    const splitter = viewState.slot.nodes.find((n) => n.type === "SPLITTER")
    const component = card || splitter

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-1 mb-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{viewState.slot.name}</h3>
            <p className="text-sm text-muted-foreground">
              {card ? "Click on the Network Card to view ports" : splitter ? "Click on the Splitter to view legs" : "This slot is empty"}
            </p>
          </div>
        </div>

        <div className={cn("rounded-xl border-2 bg-card p-6 max-w-2xl mx-auto", getStatusBorder(viewState.slot.status))}>
          {component ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                card
                  ? navigateToCard(card, viewState.slot!, viewState.shelf!, viewState.rack!)
                  : splitter && navigateToSplitter(splitter, viewState.slot!, viewState.shelf!, viewState.rack!)
              }
              className={cn(
                "w-full p-6 rounded-lg border-2 transition-all cursor-pointer",
                "bg-secondary/30 hover:bg-secondary/50",
                getStatusBorder(component.status)
              )}
            >
              <div className="flex items-center gap-4">
                {card && <Cpu className="h-12 w-12 text-primary" />}
                {splitter && <div className="text-orange-500">{getEquipmentIcon("SPLITTER")}</div>}
                <div className="text-left">
                  <p className="font-mono text-lg text-foreground">{component.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {card && `${card.nodes.filter((n) => n.type === "PORT").length} Ports`}
                    {splitter && `${splitter.nodes.filter((n) => n.type === "SPLITTER LEG").length} Legs`}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-2 text-[10px]",
                      component.status === "ACTIVE"
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : "border-zinc-500/30 text-zinc-400"
                    )}
                  >
                    {component.status}
                  </Badge>
                </div>
              </div>
            </motion.button>
          ) : (
            <div className="text-center py-12">
              <Box className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
              <p className="text-muted-foreground">No Network Card or Splitter installed in this slot</p>
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

        <div className={cn("rounded-lg border-2 bg-card p-4 max-w-2xl mx-auto", getStatusBorder(viewState.card.status))}>
          <div className="grid grid-cols-4 gap-2">
            {ports.map((port) => (
              <motion.button
                key={port.erId}
                whileHover={isPortClickable(port.status) ? { scale: 1.05 } : {}}
                whileTap={isPortClickable(port.status) ? { scale: 0.95 } : {}}
                onClick={() => isPortClickable(port.status) && navigateToPorts(viewState.shelf!, viewState.slot!, viewState.card!, viewState.rack!)}
                disabled={!isPortClickable(port.status)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                  isPortClickable(port.status)
                    ? "bg-card hover:bg-secondary/50 cursor-pointer border-border"
                    : "bg-card cursor-not-allowed border-border opacity-50"
                )}
              >
                <div
                  className={cn(
                    "h-9 w-9 rounded-full shadow-lg flex items-center justify-center",
                    getPortColor(port.status)
                  )}
                >
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] font-mono font-semibold text-foreground">{port.name}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[7px] capitalize px-1 py-0 h-3",
                    port.status?.toUpperCase() === "FREE"
                      ? "border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/10"
                      : (port.status?.toUpperCase() === "BUSY" || port.status?.toUpperCase() === "ACTIVE")
                        ? "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10"
                        : port.status?.toUpperCase() === "PENDING"
                          ? "border-yellow-400/40 text-yellow-600 dark:text-yellow-400 bg-yellow-400/10"
                          : port.status?.toUpperCase() === "RETIRED"
                            ? "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10"
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

  // Render Splitter View - Show splitter legs
  const renderSplitterView = () => {
    if (!viewState.card || !viewState.slot || !viewState.shelf || !viewState.rack) return null
    const legs = viewState.card.nodes.filter((n) => n.type === "SPLITTER LEG")

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{viewState.card.name}</h3>
            <p className="text-sm text-muted-foreground">Splitter legs overview</p>
          </div>
        </div>

        <div className={cn("rounded-lg border-2 bg-card p-4 max-w-2xl mx-auto", getStatusBorder(viewState.card.status))}>
          <div className="grid grid-cols-4 gap-2">
            {legs.map((leg) => (
              <div
                key={leg.erId}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg border",
                  "bg-card border-border"
                )}
              >
                <div className={cn("h-9 w-9 rounded-full shadow-lg flex items-center justify-center", getPortColor(leg.status))}>
                  <GitBranch className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] font-mono font-semibold text-foreground">{leg.name}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[7px] capitalize px-1 py-0 h-3",
                    leg.status?.toUpperCase() === "ACTIVE"
                      ? "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10"
                      : "border-zinc-400/40 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {leg.status}
                </Badge>
              </div>
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

    const getPortColorLocal = (status: string) => {
      switch (status?.toUpperCase()) {
        case "FREE":
          return "bg-green-500"
        case "BUSY":
          return "bg-red-500"
        case "ACTIVE":
          return "bg-red-500"
        case "PENDING":
          return "bg-yellow-400"
        case "RETIRED":
          return "bg-blue-500"
        default:
          return "bg-zinc-400"
      }
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1 mb-2">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {viewState.shelf.name} - {viewState.card.name}
            </h3>
            <p className="text-xs text-muted-foreground">Port status overview</p>
          </div>
        </div>

        <div className={cn("rounded-lg border-2 bg-card p-4 max-w-2xl mx-auto", getStatusBorder(viewState.card.status))}>
          {/* Card Visual with Ports */}
          <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-muted-foreground">{viewState.card.name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[8px]",
                  viewState.card.status === "ACTIVE"
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : "border-zinc-500/30 text-zinc-400"
                )}
              >
                {viewState.card.status}
              </Badge>
            </div>

            {/* Ports Grid - Visual Representation */}
            <div className="grid grid-cols-4 gap-2">
              {ports.map((port) => (
                <motion.button
                  key={port.erId}
                  whileHover={isPortClickable(port.status) ? { scale: 1.08 } : {}}
                  disabled={!isPortClickable(port.status)}
                  onClick={() => isPortClickable(port.status) && navigateToPorts(viewState.shelf!, viewState.slot!, viewState.card!, viewState.rack!)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                    isPortClickable(port.status)
                      ? "bg-zinc-800/50 border-zinc-700/50 cursor-pointer hover:border-zinc-600/50"
                      : "bg-zinc-800/50 border-zinc-700/50 cursor-not-allowed opacity-40"
                  )}
                >
                  {/* Port Circle */}
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full shadow-lg flex items-center justify-center",
                      getPortColorLocal(port.status)
                    )}
                  >
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  {/* Port Label */}
                  <span className="text-[9px] font-mono text-foreground">{port.name}</span>
                  <span className="text-[7px] text-muted-foreground capitalize">{port.status}</span>
                </motion.button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-1 mt-3 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-[8px] text-muted-foreground">Free</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-[8px] text-muted-foreground">Busy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-[8px] text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[8px] text-muted-foreground">Retired</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* OLT Details Dialog */}
      <Dialog open={showOltDialog} onOpenChange={setShowOltDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              OLT Details
            </DialogTitle>
          </DialogHeader>
          {selectedOlt && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium text-foreground">{selectedOlt.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium text-foreground">{selectedOlt.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={cn(
                  selectedOlt.status === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-zinc-500/20 text-zinc-600 dark:text-zinc-400"
                )}>
                  {selectedOlt.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Racks</p>
                <p className="text-sm font-medium text-foreground">{selectedOlt.nodes?.filter(n => n.type === "RACK").length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Equipment ID</p>
                <p className="text-sm font-medium text-foreground font-mono">{selectedOlt.erId}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Device GUI */}
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
          {viewState.level === "splitter" && renderSplitterView()}
          {viewState.level === "ports" && renderPortsView()}
        </motion.div>
      </AnimatePresence>
    </>
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
  const [showHierarchy, setShowHierarchy] = useState(true)
  const [showSummary, setShowSummary] = useState(false)

  // Tab State
  const [tabs, setTabs] = useState<TabData[]>([
    { id: "search", title: "Search", type: "search", closable: false }
  ])
  const [activeTabId, setActiveTabId] = useState<string>("search")

  const addTab = (type: TabType, title: string, context?: any) => {
    const id = context?.node?.erId ? `${type}-${context.node.erId}` : `${type}-${Date.now()}`

    // Check if tab already exists
    const existingTab = tabs.find(t => t.id === id)
    if (existingTab) {
      setActiveTabId(id)
      return
    }

    const newTab: TabData = {
      id,
      title,
      type,
      closable: true,
      context
    }
    setTabs([...tabs, newTab])
    setActiveTabId(id)
  }

  const removeTab = (e: React.MouseEvent | React.KeyboardEvent | any, id: string) => {
    e.stopPropagation()
    const newTabs = tabs.filter(t => t.id !== id)
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id)
    }
    setTabs(newTabs)
  }

  // Modal states (kept for internal components if needed, but tabs preferred now)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [modalContext, setModalContext] = useState<{
    node: EquipmentNode | null
    type?: "parent" | "sibling"
  }>({ node: null })


  // Removed auto-load - user must click Search button to fetch data

  const handleSearch = useCallback(async (overrideQuery?: string) => {
    const equipmentName = (overrideQuery || searchQuery).trim() || DEFAULT_SEARCH_PARAMS.equipmentName
    if (!equipmentName) {
      setError("Please provide equipment name. It should not be empty.")
      return;
    }
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

      // Call the API - do NOT use mock fallback, show actual errors
      const apiResponse = await fetchEquipmentHierarchy(params, false)

      // Check if equipment is null (no record found)
      if (!apiResponse.equipment) {
        setSearchResult(null)
        setSelectedNode(null)
        setError("No record found for the specified equipment. Please check the equipment name and category.")
        return
      }

      // Convert to UI format
      const result = toEquipmentResponse(apiResponse)
      setSearchResult(result)
      setSelectedNode(result.equipment)
    } catch (err) {
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

  const onAdd = (node: EquipmentNode, type: "child" | "sibling") => {
    addTab(type === "child" ? "add-child" : "add-sibling", node.erId, { node, type })
  }

  const onEdit = (node: EquipmentNode) => {
    addTab("edit", node.erId, { node })
  }

  const onRemove = (node: EquipmentNode) => {
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      if (searchResult) {
        const removeRecursive = (current: EquipmentNode): EquipmentNode => ({
          ...current,
          nodes: current.nodes.filter(n => n.erId !== node.erId).map(removeRecursive)
        })
        const newEquipment = removeRecursive(searchResult.equipment)
        setSearchResult({ ...searchResult, equipment: newEquipment })
        if (selectedNode?.erId === node.erId) {
          setSelectedNode(null)
        }
      }
    }
  }

  const updateNodeInHierarchy = (root: EquipmentNode, updatedNode: EquipmentNode): EquipmentNode => {
    if (root.erId === updatedNode.erId) return updatedNode
    return {
      ...root,
      nodes: root.nodes.map(node => updateNodeInHierarchy(node, updatedNode))
    }
  }

  const handleSaveTab = (tab: TabData, updatedNode: EquipmentNode) => {
    if (searchResult) {
      const newEquipment = updateNodeInHierarchy(searchResult.equipment, updatedNode)
      setSearchResult({ ...searchResult, equipment: newEquipment })
      if (selectedNode?.erId === updatedNode.erId) {
        setSelectedNode(updatedNode)
      }
    }
    removeTab({ stopPropagation: () => { } } as any, tab.id)
  }

  const handleCreateNewEquipment = (name?: string) => {
    addTab("new", "New")
  }

  const renderSearchTab = () => (
    <div className="space-y-1">
      {/* Search Section */}
      <Card className="rounded-lg border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs text-foreground flex items-center gap-2">
              <Search className="h-3 w-3 text-primary" />
              Equipment Search
            </CardTitle>
            <Badge variant="outline" className="text-[9px] uppercase">
              ENV: {currentEnv}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-1 px-2 pb-1">
          <div className="flex flex-col gap-2">
            {/* Single Row: Search Input + Category Filter + Search Button */}
            <div className="flex items-end gap-1">
              {/* Equipment Name Typeahead - Flexible Width */}
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Equipment Name</label>
                <EquipmentTypeaheadSearch
                  onSelect={(equipment) => {
                    setSearchQuery(equipment.nodeName)
                  }}
                  isLoading={isSearching}
                />
              </div>

              {/* Category Filter */}
              <div className="w-28">
                <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <Filter className="h-2.5 w-2.5 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="olt">OLT</SelectItem>
                    <SelectItem value="ont">ONT</SelectItem>
                    <SelectItem value="fdh">FDH</SelectItem>
                    <SelectItem value="ap">AP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <Button
                onClick={() => handleSearch(searchQuery)}
                disabled={isSearching}
                className="h-10 px-4 whitespace-nowrap"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-1" />
                    Search
                  </>
                )}
              </Button>
              {/* New Button */}
              <Button
                onClick={() => handleCreateNewEquipment()}
                disabled={isSearching}
                className="h-10 px-4 whitespace-nowrap"
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
              <span className="text-xs text-destructive">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {isSearching ? (
        <Card className="rounded-lg border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
            <h3 className="text-sm font-semibold text-foreground">Loading Equipment Hierarchy</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Fetching data from API...
            </p>
          </CardContent>
        </Card>
      ) : !searchResult ? (
        <Card className="rounded-lg border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary mb-3">
              <Server className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Search for Equipment</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Enter an equipment name above to search and explore the device hierarchy.
              Results will show the full structure from OLT/FDH down to individual ports.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-1">
          {/* Hierarchy Tree Panel */}
          <AnimatePresence>
            {showHierarchy && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:col-span-5"
              >
                <Card className="rounded-lg border-border/50 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs text-foreground flex items-center gap-2">
                        <Server className="h-3 w-3 text-primary" />
                        Hierarchy
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHierarchy(false)}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[65vh] overflow-y-auto px-2 pb-1">
                      <HierarchyTreeNode
                        node={searchResult.equipment}
                        onSelect={handleNodeSelect}
                        selectedNode={selectedNode}
                        onAdd={onAdd}
                        onEdit={onEdit}
                        onRemove={onRemove}
                      />
                    </div>

                    {/* Summary Stats */}
                    <div className="border-t border-border/50 px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold text-foreground">Summary</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSummary(!showSummary)}
                          className="h-5 w-5 p-0"
                        >
                          {showSummary ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </div>
                      {showSummary && (
                        <div className="grid grid-cols-3 gap-1">
                          {Object.entries(searchResult.summary.countsByType).map(([type, count]) => (
                            <div key={type} className="text-center p-1 rounded bg-secondary/30 border border-border/30">
                              <p className="text-xs font-bold text-foreground">{count}</p>
                              <p className="text-[8px] text-muted-foreground">{type}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {!showHierarchy && (
            <div className="lg:col-span-1 flex items-center justify-center">
              <Button variant="outline" size="sm" onClick={() => setShowHierarchy(true)} className="h-8 px-2 text-xs">
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Device GUI Panel */}
          <Card className={cn("rounded-lg border-border/50 overflow-y-auto overflow-x-hidden max-h-[70vh]", showHierarchy ? "lg:col-span-7" : "lg:col-span-12")}>
            <CardHeader className="pb-2 sticky top-0 bg-card z-10 border-b border-border/50">
              <CardTitle className="text-xs text-foreground flex items-center gap-2">
                <Monitor className="h-3 w-3 text-primary" />
                Device Explorer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1 px-2 pb-1">
              <DeviceGUIPanel equipment={searchResult.equipment} selectedNode={selectedNode} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  const renderEditorTab = (tab: TabData) => {
    if (!tab.context || !tab.context.node) return null

    // Use local state for the tab content to allow "Save" vs "Cancel"
    // Since this is inside render, we'll use a component to wrap it
    return (
      <EditorTabContent
        tab={tab}
        onSave={(updated) => handleSaveTab(tab, updated)}
        onCancel={() => removeTab({ stopPropagation: () => { } } as any, tab.id)}
      />
    )
  }

  function EditorTabContent({ tab, onSave, onCancel }: { tab: TabData, onSave: (node: EquipmentNode) => void, onCancel: () => void }) {
    const [localNode, setLocalNode] = useState<EquipmentNode>(JSON.parse(JSON.stringify(tab.context!.node)))

    const handleAddChildLocal = (parentNode: EquipmentNode) => {
      const newNode: EquipmentNode = {
        name: "New Node",
        type: "RACK",
        instanceID: null,
        erId: "new-" + Date.now(),
        status: "ACTIVE",
        nodes: []
      }

      const updateRecursive = (current: EquipmentNode): EquipmentNode => {
        if (current.erId === parentNode.erId) {
          return { ...current, nodes: [...current.nodes, newNode] }
        }
        return { ...current, nodes: current.nodes.map(updateRecursive) }
      }

      setLocalNode(updateRecursive(localNode))
    }

    return (
      <Card className="rounded-lg border-border/50 shadow-sm">
        <CardHeader className="pb-2 border-b border-border/50 bg-secondary/5">
          <CardTitle className="text-xs flex items-center gap-2">
            {tab.type === "edit" ? <Pencil className="h-3 w-3 text-primary" /> : <Plus className="h-3 w-3 text-primary" />}
            {tab.type === "edit" ? "Edit Equipment" : `Add ${tab.context?.type} Equipment`}
          </CardTitle>
          <div className="text-[9px] text-muted-foreground font-mono">
            {tab.type === "edit"
              ? `Ref ID: ${tab.context?.node?.erId}`
              : `Parent: ${tab.context?.node?.name}`}
          </div>
        </CardHeader>
        <CardContent className="pt-1 px-2 pb-1">
          <div className="max-w-full space-y-3">
            <EditableHierarchyNode
              node={localNode}
              onUpdate={setLocalNode}
              onAddChild={handleAddChildLocal}
              onRemove={(nodeToRemove) => {
                const removeRecursive = (current: EquipmentNode): EquipmentNode => ({
                  ...current,
                  nodes: current.nodes.filter(n => n.erId !== nodeToRemove.erId).map(removeRecursive)
                })
                setLocalNode(removeRecursive(localNode))
              }}
            />
            <div className="mt-4 pt-4 border-t border-border/50 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
              <Button size="sm" onClick={() => onSave(localNode)}>
                {tab.type === "edit" ? "Update Record" : "Create Record"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderNewTab = (tab: TabData) => {
    return (
      <Card className="rounded-lg border-border/50">
        <CardHeader className="pb-2 border-b border-border/50">
          <CardTitle className="text-xs flex items-center gap-2">
            <Plus className="h-3 w-3 text-primary" />
            Create New Equipment
          </CardTitle>
          <p className="text-[7px] text-muted-foreground uppercase font-bold tracking-tight">Define a new root equipment node</p>
        </CardHeader>
        <CardContent className="pt-1 px-2 pb-1">
          <div className="max-w-full space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-equip-name">Equipment Name</Label>
                <Input id="new-equip-name" placeholder="Enter name (e.g. OLT-BOS-01)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-equip-type">Equipment Type</Label>
                <Select defaultValue="OLT">
                  <SelectTrigger id="new-equip-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OLT">OLT</SelectItem>
                    <SelectItem value="FDH">FDH</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
              <Button variant="outline" onClick={() => removeTab({ stopPropagation: () => { } } as any, tab.id)}>Cancel</Button>
              <Button onClick={() => removeTab({ stopPropagation: () => { } } as any, tab.id)}>Create Root Equipment</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* ServiceNow Style Tab Bar */}
        <div className="flex items-center gap-0.5 border-b border-border/50 bg-secondary/5 px-1 pt-1 -mx-4 md:-mx-6 -mt-4 md:-mt-6 shadow-sm overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTabId(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveTabId(tab.id)
                }
              }}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2.5 text-[11px] font-medium transition-all rounded-t-md border-t border-x whitespace-nowrap min-w-[80px] cursor-pointer outline-none",
                activeTabId === tab.id
                  ? "bg-background border-border/50 text-primary z-10 -mb-[px] font-semibold"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1 rounded-sm",
                activeTabId === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground/60"
              )}>
                {tab.type === "search" && <Search className="h-3 w-3" />}
                {tab.type === "new" && <Plus className="h-3 w-3" />}
                {(tab.type === "edit" || tab.type === "add-child" || tab.type === "add-sibling") && <Pencil className="h-3 w-3" />}
              </div>

              <span className="max-w-[120px] truncate">{tab.title}</span>

              {tab.closable && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
                      className="ml-1 p-0.5 rounded-sm hover:bg-destructive/10 hover:text-destructive opacity-40 group-hover:opacity-100 transition-all cursor-pointer"
                      onClick={(e) => removeTab(e, tab.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          removeTab(e, tab.id)
                        }
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">Close tab</TooltipContent>
                </Tooltip>
              )}

              {activeTabId === tab.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute top-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
                />
              )}
            </div>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-full"
            >
              {activeTab?.type === "search" && renderSearchTab()}
              {(activeTab?.type === "edit" || activeTab?.type === "add-child" || activeTab?.type === "add-sibling") && renderEditorTab(activeTab)}
              {activeTab?.type === "new" && renderNewTab(activeTab)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  )
}
