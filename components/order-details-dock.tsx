"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
            className="relative w-full sm:max-w-md md:max-w-lg lg:max-w-2xl bg-card border-l border-border/50 h-full overflow-y-auto shadow-2xl"
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

                {/* Accordions */}
                <Accordion type="multiple" defaultValue={["order-details"]} className="space-y-2">
                  {/* Order Details Accordion */}
                  <AccordionItem value="order-details" className="border border-border/30 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="font-semibold text-foreground">Order Details</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
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
                          <p className="text-xs text-muted-foreground font-medium">Circuit</p>
                          <p className="text-sm text-foreground font-mono">{lciData.service.circuit}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Service ID</p>
                        <p className="text-sm text-foreground">{lciData.service.serviceId}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Address Details Accordion */}
                  <AccordionItem value="address-details" className="border border-border/30 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="font-semibold text-foreground">Address Details</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
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
                    </AccordionContent>
                  </AccordionItem>

                  {/* Customer Details Accordion */}
                  <AccordionItem value="customer-details" className="border border-border/30 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="font-semibold text-foreground">Customer Details</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
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
                    </AccordionContent>
                  </AccordionItem>

                  {/* Ethernet/Technical Details Accordion */}
                  <AccordionItem value="ethernet-details" className="border border-border/30 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="font-semibold text-foreground">Technical Details</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <Tabs defaultValue="ethernet" className="w-full">
                        <TabsList className="grid w-full grid-cols-1">
                          <TabsTrigger value="ethernet">Ethernet</TabsTrigger>
                        </TabsList>
                        <TabsContent value="ethernet" className="space-y-4 mt-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-medium">ODIN Reservation</p>
                                <p className="text-sm text-foreground bg-secondary/50 p-2 rounded">ORSv-299998988</p>
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

                          {/* Dummy Table */}
                          <div className="mt-6 overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-secondary/30">
                                  <th className="border border-border/30 px-3 py-2 text-left text-xs font-semibold">Type</th>
                                  <th className="border border-border/30 px-3 py-2 text-left text-xs font-semibold">ESA</th>
                                  <th className="border border-border/30 px-3 py-2 text-left text-xs font-semibold">Entity Attribute(s)</th>
                                  <th className="border border-border/30 px-3 py-2 text-left text-xs font-semibold">Path Updated</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-border/30 px-3 py-2 text-foreground">PhysicalPort</td>
                                  <td className="border border-border/30 px-3 py-2 text-muted-foreground">SPFFMOE1</td>
                                  <td className="border border-border/30 px-3 py-2 text-center">●</td>
                                  <td className="border border-border/30 px-3 py-2 text-foreground">-</td>
                                </tr>
                                <tr className="bg-secondary/10">
                                  <td className="border border-border/30 px-3 py-2 text-foreground">PhysicalLink</td>
                                  <td className="border border-border/30 px-3 py-2 text-muted-foreground">SPFFMOE1</td>
                                  <td className="border border-border/30 px-3 py-2 text-center">●</td>
                                  <td className="border border-border/30 px-3 py-2 text-foreground">-</td>
                                </tr>
                                <tr>
                                  <td className="border border-border/30 px-3 py-2 text-foreground">SplitterEnclosure</td>
                                  <td className="border border-border/30 px-3 py-2 text-muted-foreground">SPFFMOE1</td>
                                  <td className="border border-border/30 px-3 py-2 text-center">●</td>
                                  <td className="border border-border/30 px-3 py-2 text-foreground">-</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
