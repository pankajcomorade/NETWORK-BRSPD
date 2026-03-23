"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { EquipmentHierarchyExplorer } from "@/components/equipment-hierarchy-explorer"
import { cn } from "@/lib/utils"

interface EquipmentNode {
  name: string
  type: string
  instanceID: number | null
  erId: string
  status: string
  nodes?: EquipmentNode[]
}

interface EquipmentHierarchyResponse {
  equipment: EquipmentNode
  summary?: {
    countsByType: Record<string, number>
    totalNodes: number
  }
}

interface EquipmentHierarchyModalProps {
  isOpen: boolean
  onClose: () => void
  portInstId: number | null
  equipmentName: string
}

export function EquipmentHierarchyModal({
  isOpen,
  onClose,
  portInstId,
  equipmentName,
}: EquipmentHierarchyModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hierarchyData, setHierarchyData] = useState<EquipmentHierarchyResponse | null>(null)

  // Fetch hierarchy details when modal opens
  useEffect(() => {
    if (isOpen && portInstId) {
      fetchHierarchy()
    }
  }, [isOpen, portInstId])

  const fetchHierarchy = async () => {
    if (!portInstId) {
      setError("Missing equipment information")
      return
    }

    setLoading(true)
    setError(null)
    try {
      console.log("[v0] Fetching hierarchy for portInstId:", portInstId)
      const apiUrl = `/api/address/equipment-hierarchy-details?portInstId=${encodeURIComponent(portInstId)}`
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch hierarchy: ${response.status}`)
      }

      const data: EquipmentHierarchyResponse = await response.json()
      console.log("[v0] Hierarchy data:", data)
      setHierarchyData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch hierarchy details"
      console.error("[v0] Hierarchy fetch error:", err)
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background border-b pb-4">
          <DialogTitle>Equipment Hierarchy: {equipmentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading hierarchy details...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="flex items-start gap-3 pt-6">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-600 dark:text-red-400">Error</p>
                  <p className="text-sm text-red-500">{error}</p>
                  <Button onClick={fetchHierarchy} variant="outline" size="sm" className="mt-2">
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hierarchy Data */}
          {hierarchyData && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {/* Equipment Header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{hierarchyData.equipment.name}</h3>
                      <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400">
                        {hierarchyData.equipment.type}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Equipment ID</p>
                        <p className="font-mono text-sm text-foreground">{hierarchyData.equipment.instanceID}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">ER ID</p>
                        <p className="font-mono text-sm text-foreground">{hierarchyData.equipment.erId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Status</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            hierarchyData.equipment.status?.toLowerCase() === "active"
                              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : "border-amber-500/30 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {hierarchyData.equipment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Equipment Hierarchy Tree */}
              {hierarchyData.equipment && (
                <EquipmentHierarchyExplorer equipment={hierarchyData.equipment} />
              )}

              {/* Summary Statistics */}
              {hierarchyData.summary && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium text-foreground mb-4">Equipment Summary</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(hierarchyData.summary.countsByType).map(([type, count]) => (
                        <div key={type} className="bg-secondary/50 rounded p-3">
                          <p className="text-xs text-muted-foreground truncate">{type}</p>
                          <p className="text-lg font-semibold text-foreground">{count}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-secondary/30 rounded">
                      <p className="text-xs text-muted-foreground">Total Nodes</p>
                      <p className="text-2xl font-bold text-foreground">{hierarchyData.summary.totalNodes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* No Data State */}
          {!loading && !error && !hierarchyData && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No hierarchy data available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
