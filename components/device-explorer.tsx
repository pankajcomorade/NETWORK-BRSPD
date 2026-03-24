"use client"

import { useState } from "react"
import { ChevronLeft, AlertCircle, Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getEquipmentIcon, getPortStatusColor } from "@/lib/equipment-icons"

interface EquipmentNode {
  name: string
  type: string
  instanceID: number | null
  erId: string
  status: string
  nodes?: EquipmentNode[]
}

interface DeviceExplorerProps {
  equipment: EquipmentNode | null
}

export function DeviceExplorer({ equipment }: DeviceExplorerProps) {
  const [currentLevel, setCurrentLevel] = useState<EquipmentNode | null>(equipment)
  const [breadcrumb, setBreadcrumb] = useState<EquipmentNode[]>(equipment ? [equipment] : [])

  // Handle drilling into a child node
  const handleDrillIn = (node: EquipmentNode) => {
    setCurrentLevel(node)
    setBreadcrumb([...breadcrumb, node])
  }

  // Handle going back
  const handleBack = () => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1)
      setBreadcrumb(newBreadcrumb)
      setCurrentLevel(newBreadcrumb[newBreadcrumb.length - 1])
    }
  }

  if (!currentLevel) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
        <p className="text-muted-foreground">No equipment data available</p>
      </div>
    )
  }

  const children = currentLevel.nodes && currentLevel.nodes.length > 0 ? currentLevel.nodes : []
  const canDrillDown = children.length > 0 && currentLevel.type?.toUpperCase() !== "PORT"

  return (
    <div className="space-y-4">
      {/* Header with breadcrumb and back button */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {breadcrumb.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-1 h-8"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <h3 className="text-lg font-semibold text-foreground">{currentLevel.name}</h3>
        </div>
        {canDrillDown && (
          <p className="text-xs text-muted-foreground">
            Click on a {children[0]?.type.toLowerCase()} to drill in
          </p>
        )}
      </div>

      {/* Equipment Details Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Equipment Type</p>
              <Badge className="mt-1 uppercase bg-primary/20 text-primary hover:bg-primary/30">
                {currentLevel.type}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Status</p>
              <Badge
                className={cn(
                  "mt-1 uppercase",
                  currentLevel.status?.toUpperCase() === "ACTIVE"
                    ? "bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30"
                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30"
                )}
              >
                {currentLevel.status || "Unknown"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Instance ID</p>
              <p className="text-sm font-mono text-foreground mt-1">
                {currentLevel.instanceID || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">ER ID</p>
              <p className="text-sm font-mono text-foreground mt-1">{currentLevel.erId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Child Nodes Grid */}
      {children.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            {children[0]?.type}s ({children.length})
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {children.map((child, idx) => (
              <button
                key={idx}
                onClick={() => handleDrillIn(child)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all hover:shadow-md text-left",
                  "border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50",
                  canDrillDown && "cursor-pointer"
                )}
              >
                <div className="text-2xl mb-2">{getEquipmentIcon(child.type)}</div>
                <p className="font-medium text-sm text-foreground truncate">
                  {child.name}
                </p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] py-0">
                    {child.type}
                  </Badge>
                  {child.status && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] py-0",
                        getPortStatusColor(child.status)
                      )}
                    >
                      {child.status}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Box className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No child equipment found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
