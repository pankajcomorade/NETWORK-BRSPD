"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { DeviceExplorer } from "@/components/device-explorer"

interface EquipmentNode {
  name: string
  type: string
  instanceID: number | null
  erId: string
  status: string
  nodes?: EquipmentNode[]
}

interface EquipmentHierarchyResponse {
  equipment: EquipmentNode | null
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

      // Handle null equipment
      if (!data.equipment) {
        setError("No equipment data found for this device")
        return
      }

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="sticky top-0 bg-background border-b pb-4 -mx-6 px-6">
          <DialogTitle className="text-xl">Device Explorer: {equipmentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading device hierarchy...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-red-500/30 bg-red-500/5">
                <CardContent className="flex items-start gap-3 pt-6">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-600 dark:text-red-400">Unable to Load Hierarchy</p>
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                    <button
                      onClick={fetchHierarchy}
                      className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Device Explorer */}
          {hierarchyData && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {hierarchyData.equipment ? (
                <DeviceExplorer equipment={hierarchyData.equipment} />
              ) : (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="flex items-start gap-3 pt-6">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-600 dark:text-amber-400">No Equipment Data</p>
                      <p className="text-sm text-amber-500 mt-1">
                        The equipment data is not available for this device.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* No Data State */}
          {!loading && !error && !hierarchyData && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Ready to load device hierarchy</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
