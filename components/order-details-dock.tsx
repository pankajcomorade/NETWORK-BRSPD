"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface OrderDetailsResponse {
  order: {
    orderId: number
    orderNumber: string
    orderType: string
    orderStatus: string
    dueDate: string
    createdDate: string | null
    co: string
    lciCount: number
    lcis: Array<{
      lci: string
      service: {
        serviceId: number
        circuit: string
      }
      customer: {
        customerType: string | null
        firstName: string
        lastName: string
        fullName: string
      }
      address: {
        externalFullAddress: string | null
        streetNum: string
        streetName: string
        city: string
        state: string
        stateName: string | null
        zipcode: string | null
        displayName: string
      }
      ont: {
        ontId: number
        equipmentId: number
      }
    }>
  }
}

interface PONConnection {
  connectionId: number
  cableStrandName: string | null
  connectionStatus: string
  depth: number
  endpointA: {
    side: string
    equipment: {
      name: string
      type: string
      instanceID: number
    }
    port: {
      instanceID: number | null
      portName: string | null
      portNumber: string
      portInOrOut: string | null
      speed: string | null
      portVlan: string | null
      portStatus: string | null
      portType: string | null
    }
  }
  endpointB: {
    side: string
    equipment: {
      name: string
      type: string
      instanceID: number
    }
    port: {
      instanceID: number | null
      portName: string | null
      portNumber: string
      portInOrOut: string | null
      speed: string | null
      portVlan: string | null
      portStatus: string | null
      portType: string | null
    }
  }
}

interface OrderDetailsDockProps {
  isOpen: boolean
  onClose: () => void
  orderNumber: string
  lci: string
  onFetch?: (fetch: () => Promise<void>) => void
}

export function OrderDetailsDock({ isOpen, onClose, orderNumber, lci, onFetch }: OrderDetailsDockProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<OrderDetailsResponse | null>(null)
  const [ponConnections, setPonConnections] = useState<PONConnection[]>([])
  const [ponLoading, setPonLoading] = useState(false)
  const [ponError, setPonError] = useState<string | null>(null)

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    if (!orderNumber || !lci) {
      setError("Order number and LCI are required")
      return
    }

    setLoading(true)
    setError(null)
    try {
      console.log("[v0] Fetching order details for:", orderNumber, lci)

      // Use internal API route as proxy to avoid CORS
      const apiUrl = `/api/orders/details?orderNum=${encodeURIComponent(orderNumber)}&lci=${encodeURIComponent(lci)}`
      console.log("[v0] API URL:", apiUrl)

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      })

      console.log("[v0] API Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error:", response.status, errorText)
        setError(`Failed to fetch order details: ${response.status} - ${errorText}`)
        toast({ title: "Error", description: `Failed to fetch order details: ${response.status}`, variant: "destructive" })
        return
      }

      const responseData = await response.json()
      console.log("[v0] Order details response:", responseData)

      setData(responseData)
      setError(null)
      toast({ title: "Success", description: "Order details loaded successfully" })
    } catch (err) {
      console.error("[v0] Fetch error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch order details"
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [orderNumber, lci, toast])

  // Expose the fetch method to parent
  useEffect(() => {
    if (onFetch) {
      onFetch(fetchOrderDetails)
    }
  }, [onFetch, fetchOrderDetails])

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const year = date.getFullYear()
      return `${month}-${day}-${year}`
    } catch {
      return dateString || "N/A"
    }
  }

  const lciData = data?.order.lcis[0]

  // Fetch PON connectivity data when Technical Details tab is clicked
  const fetchPONConnectivity = useCallback(async () => {
    if (!data?.order.lcis[0]?.ont) {
      setPonError("ONT data not available")
      return
    }

    const { ontId, equipmentId } = data.order.lcis[0].ont

    setPonLoading(true)
    setPonError(null)
    setPonConnections([])

    try {
      console.log("[v0] Fetching PON connectivity - ontPortId:", ontId, "ontInstId:", equipmentId)

      const apiUrl = `/api/orders/pon-connectivity?ontPortId=${encodeURIComponent(ontId)}&ontInstId=${encodeURIComponent(equipmentId)}`
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      })

      console.log("[v0] PON Connectivity API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] PON API Error:", response.status, errorText)
        setPonError(`Failed to fetch PON connectivity: ${response.status}`)
        return
      }

      const ponData = await response.json()
      console.log("[v0] PON Connectivity data received:", ponData)

      if (ponData.ponConnection?.connections && Array.isArray(ponData.ponConnection.connections)) {
        setPonConnections(ponData.ponConnection.connections)
      } else {
        setPonError("No connection data found in response")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch PON connectivity"
      console.error("[v0] PON fetch error:", err)
      setPonError(errorMessage)
    } finally {
      setPonLoading(false)
    }
  }, [data])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Dock Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative w-full sm:max-w-md md:max-w-lg lg:max-w-4xl bg-card border-l border-border/50 h-full overflow-y-auto shadow-2xl"
          >
            {/* Dock Header */}
            <div className="sticky top-0 border-b border-border/50 bg-card p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Order Details</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1 hover:bg-secondary rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading order details...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="m-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Error</p>
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Content */}
            {data && lciData && !loading && (
              <div className="p-6 space-y-6">
                {/* Order Header */}
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-foreground font-mono">{data.order.orderNumber}</h4>
                  <p className="text-sm text-muted-foreground">Order ID: {data.order.orderId}</p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="order-details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 gap-1">
                    <TabsTrigger value="order-details" className="text-xs sm:text-sm">Order Details</TabsTrigger>
                    <TabsTrigger value="address-details" className="text-xs sm:text-sm">Address Details</TabsTrigger>
                    <TabsTrigger value="customer-details" className="text-xs sm:text-sm">Customer Details</TabsTrigger>
                    <TabsTrigger value="technical-details" className="text-xs sm:text-sm">Technical Details</TabsTrigger>
                  </TabsList>

                  {/* Order Details Tab */}
                  <TabsContent value="order-details" className="space-y-4 mt-6">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Order Type</p>
                          <p className="text-sm text-foreground">{data.order.orderType}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Status</p>
                          <p className="text-sm text-foreground font-semibold">{data.order.orderStatus}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">CO</p>
                          <p className="text-sm text-foreground">{data.order.co}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">LCI</p>
                          <p className="text-sm text-foreground font-mono">{lciData.lci}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Due Date</p>
                          <p className="text-sm text-foreground">{formatDate(data.order.dueDate)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">TN</p>
                          <p className="text-sm text-foreground font-mono">{lciData.service.circuit}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Service ID</p>
                        <p className="text-sm text-foreground">{lciData.service.serviceId}</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Address Details Tab */}
                  <TabsContent value="address-details" className="space-y-4 mt-6">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Address</p>
                        <p className="text-sm text-foreground">
                          {lciData.address.streetNum} {lciData.address.streetName}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">City, State, ZIP</p>
                        <p className="text-sm text-foreground">
                          {lciData.address.city}, {lciData.address.state} {lciData.address.zipcode}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Address ID</p>
                        <p className="text-sm text-foreground">{lciData.address.displayName}</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Customer Details Tab */}
                  <TabsContent value="customer-details" className="space-y-4 mt-6">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">First Name</p>
                          <p className="text-sm text-foreground">{lciData.customer.firstName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Last Name</p>
                          <p className="text-sm text-foreground">{lciData.customer.lastName}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Full Name</p>
                        <p className="text-sm text-foreground">{lciData.customer.fullName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Customer Type</p>
                        <p className="text-sm text-foreground">{lciData.customer.customerType || "N/A"}</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Technical Details Tab */}
                  <TabsContent value="technical-details" className="space-y-4 mt-6">
                    <Tabs defaultValue="ethernet" className="w-full">
                      <TabsList className="grid w-full grid-cols-1">
                        <TabsTrigger value="ethernet" onClick={fetchPONConnectivity}>Ethernet</TabsTrigger>
                      </TabsList>
                      <TabsContent value="ethernet" className="space-y-4 mt-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Speed</p>
                              <p className="text-sm text-foreground bg-secondary/50 p-2 rounded">1G</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Port Type</p>
                              <p className="text-sm text-foreground bg-secondary/50 p-2 rounded">Ethernet</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Technology</p>
                              <p className="text-sm text-foreground bg-secondary/50 p-2 rounded">GPON</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Broadband Service</p>
                              <p className="text-sm text-foreground bg-secondary/50 p-2 rounded">04BN94DM</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">SVLAN</p>
                              <p className="text-sm text-foreground bg-secondary/50 p-2 rounded">305</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">CYLAN</p>
                              <p className="text-sm text-foreground bg-secondary/50 p-2 rounded">3841</p>
                            </div>
                          </div>
                        </div>

                        {/* PON Connections Table */}
                        <div className="mt-6 space-y-3">
                          {ponLoading && (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
                              <span className="text-sm text-muted-foreground">Loading connection data...</span>
                            </div>
                          )}

                          {ponError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2">
                              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-red-400">{ponError}</p>
                            </div>
                          )}

                          {!ponLoading && ponConnections.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className="bg-secondary/30">
                                    <th colSpan={4} className="border border-border/30 px-2 py-2 text-left text-xs font-semibold text-center">Endpoint A</th>
                                    <th className="border border-border/30 px-2 py-2 text-left text-xs font-semibold text-center">Cable Strand Name</th>
                                    <th colSpan={4} className="border border-border/30 px-2 py-2 text-left text-xs font-semibold text-center">Endpoint B</th>
                                  </tr>
                                  <tr className="bg-secondary/20">
                                    <th className="border border-border/30 px-2 py-1 text-left text-xs font-semibold">Name</th>
                                    <th className="border border-border/30 px-2 py-1 text-left text-xs font-semibold">Type</th>
                                    <th className="border border-border/30 px-2 py-1 text-left text-xs font-semibold">Port Name</th>
                                    <th className="border border-border/30 px-2 py-1 text-left text-xs font-semibold">Port Number</th>
                                    <th className="border border-border/30 px-2 py-1 text-left text-xs font-semibold"></th>
                                    <th className="border border-border/30 px-2 py-1 text-left text-xs font-semibold">Name</th>
                                    <th className="border border-border/30 px-2 py-1 text-left text-xs font-semibold">Type</th>
                                    <th className="border border-border/30 px-2 py-1 text-left text-xs font-semibold">Port Name</th>
                                    <th className="border border-border/30 px-2 py-1 text-left text-xs font-semibold">Port Number</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ponConnections.map((conn, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? "" : "bg-secondary/10"}>
                                      {/* Endpoint A */}
                                      <td className="border border-border/30 px-2 py-2 text-foreground truncate" title={conn.endpointA.equipment.name}>
                                        {conn.endpointA.equipment.name}
                                      </td>
                                      <td className="border border-border/30 px-2 py-2 text-muted-foreground">
                                        {conn.endpointA.equipment.type}
                                      </td>
                                      <td className="border border-border/30 px-2 py-2 text-muted-foreground text-xs truncate" title={conn.endpointA.port.portName || "N/A"}>
                                        {conn.endpointA.port.portName || "-"}
                                      </td>
                                      <td className="border border-border/30 px-2 py-2 text-muted-foreground text-center">
                                        {conn.endpointA.port.portNumber}
                                      </td>

                                      {/* Cable Strand Name */}
                                      <td className="border border-border/30 px-2 py-2 text-primary text-center font-medium min-w-[80px]" title={conn.cableStrandName || "N/A"}>
                                        {conn.cableStrandName || "-"}
                                      </td>

                                      {/* Endpoint B */}
                                      <td className="border border-border/30 px-2 py-2 text-foreground truncate" title={conn.endpointB.equipment.name}>
                                        {conn.endpointB.equipment.name}
                                      </td>
                                      <td className="border border-border/30 px-2 py-2 text-muted-foreground">
                                        {conn.endpointB.equipment.type}
                                      </td>
                                      <td className="border border-border/30 px-2 py-2 text-muted-foreground text-xs truncate" title={conn.endpointB.port.portName || "N/A"}>
                                        {conn.endpointB.port.portName || "-"}
                                      </td>
                                      <td className="border border-border/30 px-2 py-2 text-muted-foreground text-center">
                                        {conn.endpointB.port.portNumber}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {!ponLoading && ponConnections.length === 0 && !ponError && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Click on the Ethernet tab to load connection data
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
