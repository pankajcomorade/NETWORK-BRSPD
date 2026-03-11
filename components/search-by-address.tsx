"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Home,
  Loader2,
  AlertCircle,
  User,
  Wifi,
  Router,
  Box,
  Server,
  ChevronRight,
  ChevronLeft,
  Zap,
  X,
  Layers,
  CircuitBoard,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getCurrentEnvironment } from "@/lib/env-config"
import {
  fetchAddressDetails,
  fetchNextConnection,
  fetchEquipmentConnection,
  getMockEquipmentConnection,
  type AddressDetailsResponse,
  type NextConnectionResponse,
  type EquipmentConnectionResponse,
  type ONTPort,
  type DropTerminalPort,
} from "@/lib/api/address-api"

const currentEnv = getCurrentEnvironment()

// Device node in the topology
interface TopologyNode {
  id: string
  type: "home" | "ont" | "drop-terminal" | "fdh" | "olt"
  name: string
  status: string
  data: Record<string, unknown>
  cableName?: string // Cable connecting to next device
}

interface FlowState {
  addressData: AddressDetailsResponse | null
  dropTerminalData: NextConnectionResponse | null
  fdhData: EquipmentConnectionResponse | null
  oltData: EquipmentConnectionResponse | null
  selectedOntPort: ONTPort | null
  selectedDtPort: DropTerminalPort | null
  topologyNodes: TopologyNode[]
  activeNodeIndex: number
}

export function SearchByAddress() {
  const [addressId, setAddressId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flowState, setFlowState] = useState<FlowState>({
    addressData: null,
    dropTerminalData: null,
    fdhData: null,
    oltData: null,
    selectedOntPort: null,
    selectedDtPort: null,
    topologyNodes: [],
    activeNodeIndex: -1,
  })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"customer" | "service" | "cpe" | "ont-details" | null>(null)

  const getPortStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-500"
      case "pending":
        return "bg-amber-400"
      case "retired":
        return "bg-rose-500"
      case "free":
        return "bg-sky-400"
      default:
        return "bg-zinc-400"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "online":
        return "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      case "pending":
        return "border-amber-400/40 text-amber-600 dark:text-amber-400 bg-amber-400/10"
      case "offline":
      case "inactive":
      case "suspended":
        return "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10"
      case "free":
        return "border-sky-400/40 text-sky-600 dark:text-sky-400 bg-sky-400/10"
      default:
        return "border-zinc-400/40 text-zinc-600 dark:text-zinc-400"
    }
  }

  const handleSearch = useCallback(async () => {
    if (!addressId.trim()) {
      setError("Please enter an Address ID")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchAddressDetails(addressId)
      
      if (!data || !data.customer) {
        setError("No record found for the specified Address ID")
        return
      }

      // Build initial topology with Home and ONT
      const initialNodes: TopologyNode[] = [
        {
          id: "home",
          type: "home",
          name: "HOME",
          status: "active",
          data: { customer: data.customer, service: data.service, cpe: data.cpe, address: data.address },
        },
        {
          id: "ont",
          type: "ont",
          name: data.ont?.model || "ONT",
          status: data.ont?.status || "active",
          data: { ont: data.ont },
          cableName: "Drop Cable",
        },
      ]

      setFlowState({
        addressData: data,
        dropTerminalData: null,
        fdhData: null,
        oltData: null,
        selectedOntPort: null,
        selectedDtPort: null,
        topologyNodes: initialNodes,
        activeNodeIndex: 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch address details")
    } finally {
      setIsLoading(false)
    }
  }, [addressId])

  const handleOntPortClick = useCallback(async (port: ONTPort) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchNextConnection(port.portInstId)
      
      if (!data || !data.dropTerminal) {
        setError("No Drop Terminal connected to this port")
        setIsLoading(false)
        return
      }

      // Add Drop Terminal to topology
      const newNode: TopologyNode = {
        id: "drop-terminal",
        type: "drop-terminal",
        name: data.dropTerminal.name,
        status: data.dropTerminal.status,
        data: { dropTerminal: data.dropTerminal, cable: data.cableName },
        cableName: data.cableName || "Drop Cable",
      }

      setFlowState((prev) => ({
        ...prev,
        dropTerminalData: data,
        selectedOntPort: port,
        topologyNodes: [...prev.topologyNodes.slice(0, 2), newNode],
        activeNodeIndex: 2,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch next connection")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDtPortClick = useCallback(async (port: DropTerminalPort) => {
    if (!port.equipInstId) {
      setError("No equipment connected to this port")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchEquipmentConnection(port.equipInstId, port.portInstId)
      
      if (!data || !data.targetEquipment) {
        setError("No equipment found for this connection")
        setIsLoading(false)
        return
      }

      // Add FDH to topology
      const fdhNode: TopologyNode = {
        id: "fdh",
        type: "fdh",
        name: data.targetEquipment.name || "FDH",
        status: data.targetEquipment.status || "active",
        data: { fdh: data.targetEquipment, cable: data.cableName },
        cableName: data.cableName || "Distribution Cable",
      }

      setFlowState((prev) => ({
        ...prev,
        fdhData: data,
        selectedDtPort: port,
        topologyNodes: [...prev.topologyNodes.slice(0, 3), fdhNode],
        activeNodeIndex: 3,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch equipment connection")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleFdhToOlt = useCallback(async () => {
    if (!flowState.fdhData?.targetEquipment) return

    setIsLoading(true)
    setError(null)

    try {
      const fdhEquip = flowState.fdhData.targetEquipment as { equipInstId?: number }
      const data = getMockEquipmentConnection(fdhEquip.equipInstId || 0, 0, "OLT")

      // Add OLT to topology
      const oltNode: TopologyNode = {
        id: "olt",
        type: "olt",
        name: data.targetEquipment?.name || "OLT",
        status: data.targetEquipment?.status || "active",
        data: { olt: data.targetEquipment, cable: data.cableName },
        cableName: data.cableName || "Feeder Cable",
      }

      setFlowState((prev) => ({
        ...prev,
        oltData: data,
        topologyNodes: [...prev.topologyNodes.slice(0, 4), oltNode],
        activeNodeIndex: 4,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch OLT connection")
    } finally {
      setIsLoading(false)
    }
  }, [flowState.fdhData])

  const navigateToNode = (index: number) => {
    if (index >= 0 && index < flowState.topologyNodes.length) {
      setFlowState((prev) => ({ ...prev, activeNodeIndex: index }))
    }
  }

  const goNext = () => {
    if (flowState.activeNodeIndex < flowState.topologyNodes.length - 1) {
      setFlowState((prev) => ({ ...prev, activeNodeIndex: prev.activeNodeIndex + 1 }))
    }
  }

  const goPrev = () => {
    if (flowState.activeNodeIndex > 0) {
      setFlowState((prev) => ({ ...prev, activeNodeIndex: prev.activeNodeIndex - 1 }))
    }
  }

  const resetFlow = () => {
    setFlowState({
      addressData: null,
      dropTerminalData: null,
      fdhData: null,
      oltData: null,
      selectedOntPort: null,
      selectedDtPort: null,
      topologyNodes: [],
      activeNodeIndex: -1,
    })
    setAddressId("")
    setError(null)
  }

  const openDialog = (type: "customer" | "service" | "cpe" | "ont-details") => {
    setDialogType(type)
    setDialogOpen(true)
  }

  const getNodeIcon = (type: TopologyNode["type"]) => {
    switch (type) {
      case "home":
        return Home
      case "ont":
        return Box
      case "drop-terminal":
        return CircuitBoard
      case "fdh":
        return Layers
      case "olt":
        return Server
      default:
        return Box
    }
  }

  const getNodeColor = (type: TopologyNode["type"]) => {
    switch (type) {
      case "home":
        return "bg-blue-500/10 border-blue-500/30 text-blue-500"
      case "ont":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
      case "drop-terminal":
        return "bg-amber-500/10 border-amber-500/30 text-amber-500"
      case "fdh":
        return "bg-purple-500/10 border-purple-500/30 text-purple-500"
      case "olt":
        return "bg-rose-500/10 border-rose-500/30 text-rose-500"
      default:
        return "bg-zinc-500/10 border-zinc-500/30 text-zinc-500"
    }
  }

  // Render search step
  if (flowState.topologyNodes.length === 0) {
    return (
      <div className="p-6">
        <Card className="rounded-xl border-border/50 max-w-xl mx-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Search by Address ID
              </CardTitle>
              <Badge variant="outline" className="text-[10px] uppercase">
                ENV: {currentEnv}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter Address ID..."
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-10 flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading} className="h-10 px-6">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render topology view with horizontal connected devices
  const activeNode = flowState.topologyNodes[flowState.activeNodeIndex]

  return (
    <div className="p-6 space-y-6">
      {/* Header with New Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Network Topology</h2>
          <p className="text-sm text-muted-foreground">Address ID: {addressId}</p>
        </div>
        <Button variant="outline" onClick={resetFlow} size="sm" className="gap-2">
          <X className="h-4 w-4" />
          New Search
        </Button>
      </div>

      {/* Horizontal Topology Flow */}
      <Card className="rounded-xl border-border/50 overflow-hidden">
        <CardContent className="p-6">
          {/* Topology nodes - horizontal scroll on mobile */}
          <div className="overflow-x-auto pb-4">
            <div className="flex items-center gap-0 min-w-max justify-center">
              {flowState.topologyNodes.map((node, index) => {
                const Icon = getNodeIcon(node.type)
                const isActive = index === flowState.activeNodeIndex
                const isVisited = index <= flowState.activeNodeIndex

                return (
                  <div key={node.id} className="flex items-center">
                    {/* Device Node */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigateToNode(index)}
                      className={cn(
                        "flex flex-col items-center p-4 rounded-xl border-2 transition-all min-w-[120px]",
                        isActive
                          ? "bg-primary/10 border-primary shadow-lg shadow-primary/20"
                          : isVisited
                          ? "bg-card border-border/50 hover:border-primary/50"
                          : "bg-muted/30 border-dashed border-border/30 opacity-50"
                      )}
                    >
                      <div className={cn(
                        "h-14 w-14 rounded-xl flex items-center justify-center border-2 mb-2",
                        getNodeColor(node.type)
                      )}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className="font-medium text-sm text-foreground">{node.name}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] mt-1", getStatusBadgeColor(node.status))}
                      >
                        {node.status}
                      </Badge>
                    </motion.button>

                    {/* Cable Connection */}
                    {index < flowState.topologyNodes.length - 1 && (
                      <div className="flex flex-col items-center mx-2">
                        <span className="text-[10px] text-muted-foreground mb-1 whitespace-nowrap">
                          {flowState.topologyNodes[index + 1]?.cableName || "Cable"}
                        </span>
                        <div className="flex items-center">
                          <div className={cn(
                            "h-1 w-16 rounded-full",
                            index < flowState.activeNodeIndex
                              ? "bg-primary"
                              : "bg-border"
                          )} />
                          <ChevronRight className={cn(
                            "h-5 w-5 -ml-1",
                            index < flowState.activeNodeIndex
                              ? "text-primary"
                              : "text-border"
                          )} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Placeholder for next device */}
              {flowState.topologyNodes.length < 5 && (
                <div className="flex items-center">
                  <div className="flex flex-col items-center mx-2">
                    <span className="text-[10px] text-muted-foreground mb-1">...</span>
                    <div className="flex items-center">
                      <div className="h-1 w-16 rounded-full bg-border/30 border border-dashed border-border/50" />
                      <ChevronRight className="h-5 w-5 -ml-1 text-border/50" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-border/30 bg-muted/20 min-w-[120px] opacity-50">
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center border-2 border-dashed border-border/30 mb-2">
                      <span className="text-2xl text-muted-foreground">?</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Next Device</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Device Details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeNode?.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="rounded-xl border-2 border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeNode && (
                    <>
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center border-2",
                        getNodeColor(activeNode.type)
                      )}>
                        {(() => {
                          const Icon = getNodeIcon(activeNode.type)
                          return <Icon className="h-6 w-6" />
                        })()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{activeNode.name}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">{activeNode.type.replace("-", " ")}</p>
                      </div>
                    </>
                  )}
                </div>
                {activeNode && (
                  <Badge variant="outline" className={getStatusBadgeColor(activeNode.status)}>
                    {activeNode.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Render based on active node type */}
              {activeNode?.type === "home" && renderHomeDetails()}
              {activeNode?.type === "ont" && renderOntDetails()}
              {activeNode?.type === "drop-terminal" && renderDropTerminalDetails()}
              {activeNode?.type === "fdh" && renderFdhDetails()}
              {activeNode?.type === "olt" && renderOltDetails()}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={flowState.activeNodeIndex <= 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={goNext}
          disabled={flowState.activeNodeIndex >= flowState.topologyNodes.length - 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-xl border shadow-lg flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-foreground">Loading connection data...</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3 max-w-md z-50">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Detail Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogType === "customer" && <><User className="h-5 w-5 text-blue-500" /> Customer Details</>}
              {dialogType === "service" && <><Wifi className="h-5 w-5 text-emerald-500" /> Service Details</>}
              {dialogType === "cpe" && <><Router className="h-5 w-5 text-amber-500" /> CPE Details</>}
              {dialogType === "ont-details" && <><Box className="h-5 w-5 text-primary" /> ONT Details</>}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            {dialogType === "customer" && "Customer information details"}
            {dialogType === "service" && "Service information details"}
            {dialogType === "cpe" && "CPE device information details"}
            {dialogType === "ont-details" && "ONT device information details"}
          </DialogDescription>
          <div className="space-y-3">
            {dialogType === "customer" && flowState.addressData?.customer && (
              <>
                <DetailRow label="Name" value={flowState.addressData.customer.name} />
                <DetailRow label="Account ID" value={flowState.addressData.customer.accountId} />
                <DetailRow label="Email" value={flowState.addressData.customer.email} />
                <DetailRow label="Phone" value={flowState.addressData.customer.phone} />
                <DetailRow label="Status" value={flowState.addressData.customer.status} />
              </>
            )}
            {dialogType === "service" && flowState.addressData?.service && (
              <>
                <DetailRow label="Service Name" value={flowState.addressData.service.serviceName} />
                <DetailRow label="Service ID" value={flowState.addressData.service.serviceId} />
                <DetailRow label="Speed" value={flowState.addressData.service.speed} />
                <DetailRow label="Status" value={flowState.addressData.service.status} />
                <DetailRow label="Start Date" value={flowState.addressData.service.startDate} />
              </>
            )}
            {dialogType === "cpe" && flowState.addressData?.cpe && (
              <>
                <DetailRow label="Model" value={flowState.addressData.cpe.model} />
                <DetailRow label="Serial Number" value={flowState.addressData.cpe.serialNumber} />
                <DetailRow label="MAC Address" value={flowState.addressData.cpe.macAddress} />
                <DetailRow label="Status" value={flowState.addressData.cpe.status} />
              </>
            )}
            {dialogType === "ont-details" && flowState.addressData?.ont && (
              <>
                <DetailRow label="Model" value={flowState.addressData.ont.model} />
                <DetailRow label="Serial Number" value={flowState.addressData.ont.serialNumber} />
                <DetailRow label="Status" value={flowState.addressData.ont.status} />
                <DetailRow label="Ports" value={String(flowState.addressData.ont.ports.length)} />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  // Helper component for detail rows
  function DetailRow({ label, value }: { label: string; value: string | undefined }) {
    return (
      <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value || "N/A"}</span>
      </div>
    )
  }

  // Render Home details
  function renderHomeDetails() {
    const data = flowState.addressData
    if (!data) return null

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{data.address}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Customer Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openDialog("customer")}
            className="p-4 rounded-xl border-2 border-border/50 bg-card hover:bg-secondary/30 hover:border-blue-500/30 transition-all text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <p className="font-medium text-foreground text-sm">Customer</p>
              <p className="text-xs text-muted-foreground truncate w-full">{data.customer?.name || "N/A"}</p>
            </div>
          </motion.button>

          {/* Service Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openDialog("service")}
            className="p-4 rounded-xl border-2 border-border/50 bg-card hover:bg-secondary/30 hover:border-emerald-500/30 transition-all text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                <Wifi className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="font-medium text-foreground text-sm">Service</p>
              <p className="text-xs text-muted-foreground truncate w-full">{data.service?.serviceName || "N/A"}</p>
            </div>
          </motion.button>

          {/* CPE Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openDialog("cpe")}
            className="p-4 rounded-xl border-2 border-border/50 bg-card hover:bg-secondary/30 hover:border-amber-500/30 transition-all text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
                <Router className="h-5 w-5 text-amber-500" />
              </div>
              <p className="font-medium text-foreground text-sm">CPE</p>
              <p className="text-xs text-muted-foreground truncate w-full">{data.cpe?.model || "N/A"}</p>
            </div>
          </motion.button>

          {/* ONT Info Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigateToNode(1)}
            className="p-4 rounded-xl border-2 border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                <Box className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium text-foreground text-sm">ONT</p>
              <p className="text-xs text-primary truncate w-full">View Ports</p>
            </div>
          </motion.button>
        </div>
      </div>
    )
  }

  // Render ONT details with ports
  function renderOntDetails() {
    const ont = flowState.addressData?.ont
    if (!ont) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Serial: {ont.serialNumber}</p>
            <p className="text-xs text-muted-foreground mt-1">Click on a port to fetch the connected Drop Terminal</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => openDialog("ont-details")}>
            View Details
          </Button>
        </div>

        {/* ONT Ports */}
        <div className="flex gap-4 justify-center flex-wrap">
          {ont.ports.map((port) => (
            <motion.button
              key={port.portId}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOntPortClick(port)}
              disabled={isLoading}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                "bg-card hover:bg-secondary/50 cursor-pointer min-w-[100px]",
                flowState.selectedOntPort?.portId === port.portId
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-primary/50"
              )}
            >
              <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shadow-lg", getPortStatusColor(port.status))}>
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="font-mono text-sm font-medium text-foreground">{port.portName}</span>
              <Badge variant="outline" className={cn("text-[10px]", getStatusBadgeColor(port.status))}>
                {port.status}
              </Badge>
            </motion.button>
          ))}
        </div>

        {/* Port Status Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-500" />
            <span className="text-xs text-muted-foreground">Retired</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-sky-400" />
            <span className="text-xs text-muted-foreground">Free</span>
          </div>
        </div>
      </div>
    )
  }

  // Render Drop Terminal details with ports
  function renderDropTerminalDetails() {
    const dt = flowState.dropTerminalData?.dropTerminal
    if (!dt) return null

    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Connected via: {flowState.dropTerminalData?.cableName || "Drop Cable"}</p>
          <p className="text-xs text-muted-foreground mt-1">Click on a port to fetch the connected FDH</p>
        </div>

        {/* Drop Terminal Ports */}
        <div className="flex gap-3 justify-center flex-wrap">
          {dt.ports.map((port) => (
            <motion.button
              key={port.portId}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDtPortClick(port)}
              disabled={isLoading || !port.equipInstId}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all min-w-[80px]",
                "bg-card cursor-pointer",
                flowState.selectedDtPort?.portId === port.portId
                  ? "border-primary bg-primary/10"
                  : port.equipInstId
                  ? "border-border/50 hover:bg-secondary/50 hover:border-primary/50"
                  : "border-border/30 opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shadow", getPortStatusColor(port.status))}>
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-mono text-xs font-medium text-foreground">{port.portName}</span>
              <Badge variant="outline" className={cn("text-[9px]", getStatusBadgeColor(port.status))}>
                {port.status}
              </Badge>
            </motion.button>
          ))}
        </div>

        {/* Port Status Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-500" />
            <span className="text-xs text-muted-foreground">Retired</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-sky-400" />
            <span className="text-xs text-muted-foreground">Free</span>
          </div>
        </div>
      </div>
    )
  }

  // Render FDH details
  function renderFdhDetails() {
    const fdh = flowState.fdhData?.targetEquipment
    if (!fdh) return null

    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Connected via: {flowState.fdhData?.cableName || "Distribution Cable"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border/50 bg-secondary/20">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Equipment ID:</span>
              <p className="font-medium text-foreground">{(fdh as Record<string, unknown>).equipInstId as string || "N/A"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium text-foreground">{fdh.status || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Button to fetch OLT */}
        <div className="flex justify-center">
          <Button onClick={handleFdhToOlt} disabled={isLoading} className="gap-2">
            <Server className="h-4 w-4" />
            Fetch Connected OLT
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Render OLT details
  function renderOltDetails() {
    const olt = flowState.oltData?.targetEquipment
    if (!olt) return null

    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Connected via: {flowState.oltData?.cableName || "Feeder Cable"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border/50 bg-secondary/20">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Equipment ID:</span>
              <p className="font-medium text-foreground">{(olt as Record<string, unknown>).equipInstId as string || "N/A"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium text-foreground">{olt.status || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 text-center">
          <p className="text-sm text-foreground">
            To explore the OLT hierarchy (Racks, Shelves, Slots, Ports), use the{" "}
            <span className="font-medium text-primary">Search by Equipment</span> feature.
          </p>
        </div>
      </div>
    )
  }
}
