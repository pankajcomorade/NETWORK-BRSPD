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
import { fetchEquipmentHierarchyDetails, type EquipmentHierarchyDetailsResponse } from "@/lib/api/address-api"
import { cn } from "@/lib/utils"

interface EquipmentHierarchyModalProps {
  isOpen: boolean
  onClose: () => void
  equipInstId: number | null
  portInstId: number | null
  equipmentName: string
}

export function EquipmentHierarchyModal({
  isOpen,
  onClose,
  equipInstId,
  portInstId,
  equipmentName,
}: EquipmentHierarchyModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hierarchyData, setHierarchyData] = useState<EquipmentHierarchyDetailsResponse | null>(null)

  // Fetch hierarchy details when modal opens
  useEffect(() => {
    if (isOpen && equipInstId && portInstId) {
      fetchHierarchy()
    }
  }, [isOpen, equipInstId, portInstId])

  const fetchHierarchy = async () => {
    if (!equipInstId || !portInstId) {
      setError("Missing equipment or port information")
      return
    }

    setLoading(true)
    setError(null)
    try {
      console.log("[v0] Fetching hierarchy for equipInstId:", equipInstId, "portInstId:", portInstId)
      const data = await fetchEquipmentHierarchyDetails(equipInstId, portInstId)
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background border-b pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>Equipment Hierarchy: {equipmentName}</span>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogTitle>
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
                      <h3 className="text-lg font-semibold text-foreground">{hierarchyData.equipmentName}</h3>
                      <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400">
                        {hierarchyData.equipmentType}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Equipment ID</p>
                        <p className="font-mono text-sm text-foreground">{hierarchyData.equipmentInstId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Port Status</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            hierarchyData.portStatus?.toLowerCase() === "active"
                              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : "border-amber-500/30 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {hierarchyData.portStatus || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Port Information */}
              {hierarchyData.portName && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium text-foreground mb-2">Port Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Port Name:</span>
                        <span className="text-sm font-mono text-foreground">{hierarchyData.portName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Port ID:</span>
                        <span className="text-sm font-mono text-foreground">{hierarchyData.portInstId}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hierarchy Tree */}
              {hierarchyData.hierarchy && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium text-foreground mb-4">Hierarchy Details</h4>
                    <div className="bg-muted/50 rounded p-4 font-mono text-xs text-foreground overflow-x-auto">
                      <pre>{JSON.stringify(hierarchyData.hierarchy, null, 2)}</pre>
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
