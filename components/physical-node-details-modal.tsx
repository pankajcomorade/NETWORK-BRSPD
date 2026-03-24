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

interface EquipmentResponse {
  equipment: EquipmentNode | null
  summary?: {
    countsByType: Record<string, number>
    totalNodes: number
  }
}

interface PhysicalNodeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  equipmentName: string | null
}

export function PhysicalNodeDetailsModal({
  isOpen,
  onClose,
  equipmentName,
}: PhysicalNodeDetailsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [equipmentData, setEquipmentData] = useState<EquipmentResponse | null>(null)

  // Fetch equipment details when modal opens
  useEffect(() => {
    if (isOpen && equipmentName) {
      fetchEquipmentByName()
    }
  }, [isOpen, equipmentName])

  const fetchEquipmentByName = async () => {
    if (!equipmentName) {
      setError("Missing equipment name")
      return
    }

    setLoading(true)
    setError(null)
    try {
      console.log("[v0] Fetching equipment by name:", equipmentName)
      const apiUrl = `/api/address/equipment-by-name?equipmentName=${encodeURIComponent(equipmentName)}`
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch equipment: ${response.status}`)
      }

      const data: EquipmentResponse = await response.json()
      console.log("[v0] Equipment data:", data)

      // Handle null equipment
      if (!data.equipment) {
        setError("No equipment data found for this device")
        return
      }

      setEquipmentData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch equipment details"
      console.error("[v0] Equipment fetch error:", err)
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
          <DialogTitle className="text-xl">Equipment Details: {equipmentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading equipment details...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-red-500/30 bg-red-500/5">
                <CardContent className="flex items-start gap-3 pt-6">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-600 dark:text-red-400">Unable to Load Equipment</p>
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                    <button
                      onClick={fetchEquipmentByName}
                      className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Equipment Details Explorer */}
          {equipmentData && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {equipmentData.equipment ? (
                <DeviceExplorer equipment={equipmentData.equipment} />
              ) : (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="flex items-start gap-3 pt-6">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-600 dark:text-amber-400">No Equipment Data</p>
                      <p className="text-sm text-amber-500 mt-1">
                        The equipment data is not available for this item.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* No Data State */}
          {!loading && !error && !equipmentData && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Ready to load equipment details</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
