"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface EquipmentNode {
  name: string
  type: string
  instanceID: number | null
  erId: string
  status: string
  nodes?: EquipmentNode[]
}

interface EquipmentHierarchyExplorerProps {
  equipment: EquipmentNode
  onNodeClick?: (node: EquipmentNode) => void
}

export function EquipmentHierarchyExplorer({
  equipment,
  onNodeClick,
}: EquipmentHierarchyExplorerProps) {
  const [expandedNodes, setExpandedNodes] = useState<string[]>([equipment.erId])

  const toggleNode = (erId: string) => {
    setExpandedNodes((prev) =>
      prev.includes(erId) ? prev.filter((id) => id !== erId) : [...prev, erId]
    )
  }

  const getNodeIcon = (type: string) => {
    const typeUpper = type.toUpperCase()
    switch (typeUpper) {
      case "OLT":
        return "🏢"
      case "FDH":
        return "📦"
      case "RACK":
        return "🗂️"
      case "SHELF":
        return "📚"
      case "SLOT":
        return "◻️"
      case "NETWORK CARD":
        return "🔌"
      case "PORT":
        return "⚡"
      default:
        return "📄"
    }
  }

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase()
    if (statusUpper === "ACTIVE") return "text-emerald-400"
    if (statusUpper === "INACTIVE") return "text-red-400"
    return "text-yellow-400"
  }

  const renderNode = (node: EquipmentNode, depth: number = 0) => {
    const hasChildren = node.nodes && node.nodes.length > 0
    const isExpanded = expandedNodes.includes(node.erId)

    return (
      <div key={node.erId} className="space-y-1">
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors",
            "border-l-2 border-transparent hover:border-primary/50",
            depth > 0 ? "ml-2" : "ml-0"
          )}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.erId)
            }
            onNodeClick?.(node)
          }}
        >
          {/* Expand/Collapse Arrow */}
          {hasChildren ? (
            <div
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.erId)
              }}
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}

          {/* Node Icon */}
          <span className="text-lg flex-shrink-0">{getNodeIcon(node.type)}</span>

          {/* Node Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground truncate">
                {node.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary/50 text-muted-foreground flex-shrink-0 uppercase">
                {node.type}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={cn("text-xs", getStatusColor(node.status))}>
                {node.status}
              </span>
              {node.instanceID && (
                <span className="text-xs text-muted-foreground">
                  ID: {node.instanceID}
                </span>
              )}
            </div>
          </div>

          {/* Children Count */}
          {hasChildren && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {node.nodes.length}
            </span>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.nodes.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2 p-4 bg-card rounded-lg border border-border/30">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Equipment Hierarchy
        </h3>
        {renderNode(equipment)}
      </div>
    </div>
  )
}
