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
  ArrowRight,
  Info,
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
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getCurrentEnvironment } from "@/lib/env-config"
import { useToast } from "@/components/ui/use-toast"
import {
  fetchAddressDetails,
  fetchNextConnection,
  fetchEquipmentConnection,
  fetchPONConnectivity,
  type AddressDetailsResponse,
  type NextConnectionResponse,
  type EquipmentConnectionResponse,
  type PONConnectivityResponse,
  type DropTerminalPort,
  type ONTInfo,
} from "@/lib/api/address-api"
import { EquipmentHierarchyModal } from "@/components/equipment-hierarchy-modal"

const currentEnv = getCurrentEnvironment()

// Device in the topology chain
interface DeviceNode {
  id: string
  type: "home" | "ont" | "drop-terminal" | "fdh" | "olt"
  name: string
  status: string
  cableToNext?: string
  data: Record<string, unknown>
}

const getDeviceIcon = (type: string) => {
  switch (type) {
    case "home":
      return Home
    case "ont":
      return Router
    case "drop-terminal":
      return Box
    case "fdh":
      return Server
    case "olt":
      return Server
    default:
      return Box
  }
}

const getPortColor = (status: string) => {
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

const getStatusBadgeClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
    case "pending":
      return "border-amber-400/40 text-amber-600 dark:text-amber-400 bg-amber-400/10"
    case "retired":
      return "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10"
    case "free":
      return "border-sky-400/40 text-sky-600 dark:text-sky-400 bg-sky-400/10"
    default:
      return "border-zinc-400/40 text-zinc-600 dark:text-zinc-400"
  }
}

export function SearchByAddress() {
  const { toast } = useToast()
  const [addressId, setAddressId] = useState("300000014542955")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [addressData, setAddressData] = useState<AddressDetailsResponse | null>(null)
  const [dropTerminalData, setDropTerminalData] = useState<NextConnectionResponse | null>(null)
  const [fdhData, setFdhData] = useState<EquipmentConnectionResponse | null>(null)
  const [oltData, setOltData] = useState<EquipmentConnectionResponse | null>(null)

  // Topology chain
  const [devices, setDevices] = useState<DeviceNode[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"customer" | "service" | "cpe" | "olt" | null>(null)
  const [selectedOlt, setSelectedOlt] = useState<DeviceNode | null>(null)

  // PON Connectivity states
  const [hierarchyModalOpen, setHierarchyModalOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<{
    portInstId: number
    name: string
  } | null>(null)
  const [ponConnections, setPonConnections] = useState<any[]>([])
  const [currentConnectionIndex, setCurrentConnectionIndex] = useState(0)

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!addressId.trim()) {
      setError("Please enter an Address ID")
      return
    }

    setIsLoading(true)
    setError(null)
    setDevices([])
    setAddressData(null)
    setDropTerminalData(null)
    setFdhData(null)
    setOltData(null)

    try {
      const data = await fetchAddressDetails(addressId.trim())

      // Check if we got valid data
      if (!data) {
        toast({
          title: "Error",
          description: "No response received from API",
          variant: "destructive",
        })
        return
      }

      if (!data.address) {
        toast({
          title: "Error",
          description: "No record found for the specified Address ID",
          variant: "destructive",
        })
        return
      }

      setAddressData(data)

      // Build address string
      const addressStr = [
        data.address.addressLine1,
        data.address.addressLine2,
        data.address.city,
        data.address.state,
        data.address.postalCode
      ].filter(Boolean).join(", ")

      // Build initial device chain with Home
      const homeNode: DeviceNode = {
        id: "home-" + addressId,
        type: "home",
        name: addressStr || "Home",
        status: "active",
        cableToNext: "Drop Cable",
        data: {
          address: data.address,
          customer: data.primaryCustomer,
          service: data.primaryService,
        },
      }

      const deviceNodes: DeviceNode[] = [homeNode]

      // Add ONT node if available
      if (data.ont) {
        const ontNode: DeviceNode = {
          id: `ont-${data.ont.ontId}`,
          type: "ont",
          name: data.ont.model || `ONT-${data.ont.ontId}`,
          status: data.ont.status || "Unknown",
          data: {
            ...data.ont,
          },
        }
        deviceNodes.push(ontNode)
      }

      setDevices(deviceNodes)
      setActiveIndex(0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch address details"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [addressId, toast])

  // Handle ONT port click - fetch PON Connectivity and display all connections
  const handleOntPortClick = useCallback(async (ont: ONTInfo) => {
    if (!ont.portInstId || !ont.equipInstId) {
      toast({
        title: "Error",
        description: "Missing ONT port or equipment information",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log("[v0] Fetching PON connectivity with ontPortId:", ont.portInstId, "ontInstId:", ont.equipInstId)
      const data = await fetchPONConnectivity(ont.portInstId, ont.equipInstId)

      console.log("[v0] PON Connectivity response:", data)

      if (!data || !data.ponConnection || !data.ponConnection.connections || data.ponConnection.connections.length === 0) {
        toast({
          title: "Error",
          description: "No connectivity data received",
          variant: "destructive",
        })
        return
      }

      // Store all connections
      setPonConnections(data.ponConnection.connections)
      setCurrentConnectionIndex(0)

      const allConnections = data.ponConnection.connections

      // Update ONT node with cable info from first connection
      setDevices((prev) => {
        const updated = [...prev]
        const ontIndex = updated.findIndex((d) => d.type === "ont")
        if (ontIndex !== -1) {
          updated[ontIndex] = {
            ...updated[ontIndex],
            cableToNext: allConnections[0]?.cableStrandName || "Drop Cable",
          }
        }

        // Remove any nodes after ONT
        const newDevices = updated.slice(0, ontIndex + 1)

        // Filter and chain connections following the hierarchy: ONT > AP/AT[skip] > FDH > OLT
        // Start from index 1 (skip first connection) and follow endpointB chain
        const validEquipmentTypes = ["FDH", "OLT", "ONT"]
        const processedConnections: any[] = []
        let currentConnection = allConnections[1] // Start from index 1, skip index 0

        while (currentConnection) {
          // Check if endpointB equipment type is valid (FDH, OLT, or ONT) - case insensitive
          const endpointBEquipment = currentConnection.endpointB?.equipment
          const endpointBType = endpointBEquipment?.type?.toUpperCase?.()

          if (endpointBEquipment && validEquipmentTypes.includes(endpointBType)) {
            processedConnections.push({
              equipment: endpointBEquipment,
              port: currentConnection.endpointB.port,
              cableStrandName: currentConnection.cableStrandName,
              connectionStatus: currentConnection.connectionStatus,
              connectionIndex: processedConnections.length,
            })

            // Find next connection where endpointA matches current endpointB
            const nextConnection = allConnections.find((conn, idx) => {
              return (
                idx !== allConnections.indexOf(currentConnection) &&
                conn.endpointA?.equipment?.instanceID === endpointBEquipment.instanceID
              )
            })

            currentConnection = nextConnection
          } else {
            // Skip to next connection if current endpointB doesn't match valid types
            const currentConnectionIndex = allConnections.indexOf(currentConnection)
            const nextConnection = allConnections[currentConnectionIndex + 1]
            currentConnection = nextConnection
          }
        }

        // Add processed connections as devices in the chain
        processedConnections.forEach((conn, index) => {
          const cableName = conn.cableStrandName || (index < processedConnections.length - 1 ? "Cable Link" : "")

          newDevices.push({
            id: `device-${conn.equipment.instanceID}-${index}`,
            type: conn.equipment.type?.toLowerCase?.() || "equipment",
            name: conn.equipment.name,
            status: conn.connectionStatus || "Unknown",
            portName: conn.port.portNumber || "N/A",
            cableToNext: cableName,
            data: {
              equipInstId: conn.equipment.instanceID,
              portInstId: conn.port.instanceID,
              portName: conn.port.portName,
              portNumber: conn.port.portNumber,
              connectionStatus: conn.connectionStatus,
              type: conn.equipment.type?.toUpperCase?.(),
              equipmentName: conn.equipment.name,
              connectionIndex: index,
            },
          })
        })

        return newDevices
      })

      setActiveIndex((prev) => prev + Math.max(allConnections.length - 1, 0))

      toast({
        title: "Success",
        description: `Displaying network hierarchy chain from ONT to OLT`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch PON connectivity"
      console.error("[v0] PON connectivity error:", err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Handle opening hierarchy modal for equipment
  const handleViewHierarchy = (portInstId: number, equipmentName: string) => {
    console.log("[v0] Opening hierarchy modal for equipment:", equipmentName, "portInstId:", portInstId)
    setSelectedEquipment({ portInstId, name: equipmentName })
    setHierarchyModalOpen(true)
  }

  // Handle Drop Terminal port click - fetch FDH
  const handleDtPortClick = useCallback(async (port: DropTerminalPort) => {
    setIsLoading(true)
    try {
      const data = await fetchEquipmentConnection(port.equipInstId || 0, port.portInstId)

      if (!data || !data.targetEquipment) {
        setError("No equipment found for this port")
        return
      }

      setFdhData(data)

      const fdhEquip = data.targetEquipment as { fdhId: string; name: string; status: string }

      // Update DT node with cable info and add FDH
      setDevices((prev) => {
        const updated = [...prev]
        const dtIndex = updated.findIndex((d) => d.type === "drop-terminal")
        if (dtIndex !== -1) {
          updated[dtIndex] = {
            ...updated[dtIndex],
            cableToNext: data.cableName || "Distribution Cable",
          }
        }

        // Remove any nodes after DT and add FDH
        const newDevices = updated.slice(0, dtIndex + 1)
        newDevices.push({
          id: fdhEquip.fdhId,
          type: "fdh",
          name: fdhEquip.name,
          status: fdhEquip.status,
          cableToNext: "Feeder Cable",
          data: { ...data.targetEquipment },
        })

        return newDevices
      })

      setActiveIndex((prev) => prev + 1)

      // Auto-fetch OLT after FDH
      setTimeout(async () => {
        try {
          const oltResponse = await fetchEquipmentConnection(parseInt(fdhEquip.fdhId.replace(/\D/g, "") || "0"), 0)
          if (oltResponse?.targetEquipment) {
            const oltEquip = oltResponse.targetEquipment as { oltId: string; name: string; status: string }
            setOltData(oltResponse)
            setDevices((prev) => {
              const newDevices = [...prev]
              newDevices.push({
                id: oltEquip.oltId,
                type: "olt",
                name: oltEquip.name,
                status: oltEquip.status,
                data: { ...oltResponse.targetEquipment },
              })
              return newDevices
            })
          }
        } catch {
          // OLT fetch is optional
        }
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch equipment")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const goToPrev = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1)
  }

  const goToNext = () => {
    if (activeIndex < devices.length - 1) setActiveIndex(activeIndex + 1)
  }

  const openDialog = (type: "customer" | "service" | "cpe") => {
    setDialogType(type)
    setDialogOpen(true)
  }

  const activeDevice = devices[activeIndex]

  return (
    <div className="space-y-6">
      {/* Search Section - Always on Top */}
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground flex items-center gap-1">
              <Search className="h-4 w-4 text-primary" />
              Search by Address ID
            </CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase">
              ENV: {currentEnv}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            <div className="flex-1">
              <Input
                placeholder="Enter Address ID..."
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="h-9">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {devices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Breadcrumb Chips + Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              {devices.map((device, idx) => {
                const Icon = getDeviceIcon(device.type)
                return (
                  <div key={device.id} className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveIndex(idx)}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all",
                        idx === activeIndex
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80 text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="font-medium">{device.name}</span>
                    </button>
                    {idx < devices.length - 1 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <div className="w-4 h-px bg-border" />
                        <span className="text-[10px] text-muted-foreground">{device.cableToNext}</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Prev/Next Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrev}
                disabled={activeIndex === 0}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={activeIndex === devices.length - 1}
                className="h-8"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Horizontal Topology Flow */}
          <Card className="rounded-xl border-border/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="overflow-x-auto pb-4">
                <div className="flex items-stretch gap-0 min-w-max">
                  {devices.map((device, idx) => {
                    const Icon = getDeviceIcon(device.type)
                    const isActive = idx === activeIndex

                    return (
                      <div key={device.id} className="flex items-stretch">
                        {/* Device Container */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          onClick={() => setActiveIndex(idx)}
                          className={cn(
                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all min-w-[200px]",
                            isActive
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                              : "border-border/50 bg-card hover:border-border"
                          )}
                        >
                          {/* Device Header */}
                          <div className="flex items-center gap-1 mb-3">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                isActive ? "bg-primary text-primary-foreground" : "bg-secondary"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">{device.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{device.type.replace("-", " ")}</p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] capitalize", getStatusBadgeClass(device.status))}
                          >
                            {device.status}
                          </Badge>

                          {/* Device-specific content */}
                          {device.type === "home" && (
                            <div className="mt-3 space-y-2">
                              <TooltipProvider>
                                <div className="flex gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openDialog("customer")
                                        }}
                                        className="flex-1 p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs text-center transition-colors"
                                      >
                                        <User className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                                        Customer
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Click for details</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openDialog("service")
                                        }}
                                        className="flex-1 p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs text-center transition-colors"
                                      >
                                        <Wifi className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                                        Service
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Click for details</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openDialog("cpe")
                                        }}
                                        disabled={!addressData?.ont}
                                        className={cn(
                                          "flex-1 p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs text-center transition-colors",
                                          !addressData?.ont && "opacity-50 cursor-not-allowed"
                                        )}
                                      >
                                        <Router className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                                        ONT
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Click for ONT details</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            </div>
                          )}

                          {device.type === "ont" && addressData?.ont && (
                            <div className="mt-3">
                              <p className="text-[10px] text-muted-foreground mb-2">
                                ONT ID: {addressData.ont.ontId} | Serial: {addressData.ont.ontSerial || "N/A"}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOntPortClick(addressData.ont!)
                                }}
                                disabled={isLoading || !addressData.ont.portInstId}
                                className={cn(
                                  "flex items-center gap-1 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors w-full justify-center",
                                  (!addressData.ont.portInstId) && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", getPortColor(addressData.ont.status))}>
                                  <Zap className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-foreground">Trace Connection</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </div>
                          )}

                          {device.type === "drop-terminal" && dropTerminalData?.dropTerminal && (
                            <div className="mt-3">
                              <p className="text-[10px] text-muted-foreground mb-2">Click a port to trace to FDH</p>
                              <div className="grid grid-cols-4 gap-1">
                                {dropTerminalData.dropTerminal.ports.map((port) => (
                                  <button
                                    key={port.portId}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDtPortClick(port)
                                    }}
                                    disabled={isLoading || !port.equipInstId}
                                    className={cn(
                                      "flex flex-col items-center gap-1 p-1 rounded bg-secondary/50 hover:bg-secondary transition-colors",
                                      !port.equipInstId && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    <div className={cn("h-4 w-4 rounded-full", getPortColor(port.status))} />
                                    <span className="text-[8px] font-mono text-foreground">{port.portName}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {device.type === "fdh" && (
                            <div className="mt-3 space-y-3">
                              <div>
                                <p className="text-[10px] text-muted-foreground">Distribution Cable: {device.cableToNext}</p>
                                <p className="text-xs text-foreground mt-1">ID: {device.id}</p>
                              </div>
                              {device.data?.equipInstId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs h-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewHierarchy(device.data?.equipInstId, device.name)
                                  }}
                                  disabled={isLoading}
                                >
                                  <Info className="h-3 w-3 mr-1" />
                                  View Hierarchy
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Generic Equipment Device (FDH, AP, AT, OLT, etc.) */}
                          {!["home", "ont", "drop-terminal", "fdh", "olt"].includes(device.type) && device.data && (
                            <div className="mt-3 space-y-3">
                              {/* Port Information */}
                              {(device.data.portName || device.data.portNumber || device.data.portStatus) && (
                                <div className="space-y-2 p-2 bg-secondary/30 rounded">
                                  {device.data.portName && (
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">Port Name</span>
                                      <span className="font-mono text-foreground">{device.data.portName}</span>
                                    </div>
                                  )}
                                  {device.data.portNumber && (
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">Port Number</span>
                                      <span className="font-mono text-foreground">{device.data.portNumber}</span>
                                    </div>
                                  )}
                                  {device.data.portStatus && (
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">Port Status</span>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-[10px]",
                                          device.data.portStatus?.toLowerCase() === "active"
                                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                            : "border-amber-500/30 text-amber-600 dark:text-amber-400"
                                        )}
                                      >
                                        {device.data.portStatus}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2">
                                {/* View Hierarchy button */}
                                {device.data.equipInstId && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs h-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewHierarchy(device.data.equipInstId, device.name)
                                    }}
                                    disabled={isLoading}
                                  >
                                    <Info className="h-3 w-3 mr-1" />
                                    View Hierarchy
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {device.type === "olt" && (
                            <div className="mt-3 space-y-3">
                              <div>
                                <p className="text-[10px] text-muted-foreground">Feeder Cable: {device.cableToNext}</p>
                              </div>
                              {device.data?.portInstId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs h-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewHierarchy(device.data?.portInstId, device.name)
                                  }}
                                  disabled={isLoading}
                                >
                                  <Info className="h-3 w-3 mr-1" />
                                  View Hierarchy
                                </Button>
                              )}
                            </div>
                          )}

                        </motion.div>

                        {/* Cable Connector */}
                        {idx < devices.length - 1 && (
                          <div className="flex flex-col items-center justify-center px-2">
                            <div className="flex items-center gap-1">
                              <div className="w-8 h-0.5 bg-primary/50" />
                              <ArrowRight className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-[9px] text-muted-foreground mt-1 whitespace-nowrap">
                              {device.cableToNext}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Loading indicator for next device */}
                  {isLoading && (
                    <div className="flex items-center px-4">
                      <div className="w-8 h-0.5 bg-border" />
                      <div className="p-4 rounded-xl border-2 border-dashed border-border flex items-center justify-center min-w-[150px]">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Port Status Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-xs text-muted-foreground">Retired</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-sky-400" />
                  <span className="text-xs text-muted-foreground">Free</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && devices.length === 0 && !error && (
        <Card className="rounded-xl border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-4">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Search by Address</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Enter an Address ID to trace the network path from customer premises to OLT.
              View connected devices: Home → ONT → Drop Terminal → FDH → OLT
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1">
              {dialogType === "customer" && <User className="h-5 w-5 text-primary" />}
              {dialogType === "service" && <Wifi className="h-5 w-5 text-primary" />}
              {dialogType === "cpe" && <Router className="h-5 w-5 text-primary" />}
              {dialogType === "olt" && <Server className="h-5 w-5 text-primary" />}
              {dialogType === "customer" && "Customer Details"}
              {dialogType === "service" && "Service Details"}
              {dialogType === "cpe" && "ONT Details"}
              {dialogType === "olt" && "OLT Details"}
            </DialogTitle>
          </DialogHeader>

          {dialogType === "customer" && addressData?.primaryCustomer && (
            <div className="space-y-3">
              <DetailRow
                label="Name"
                value={[addressData.primaryCustomer.customerFirstName, addressData.primaryCustomer.customerLastName].filter(Boolean).join(" ") || "N/A"}
              />
              <DetailRow label="Customer ID" value={addressData.primaryCustomer.customerId || "N/A"} />
              <DetailRow label="Customer Type" value={addressData.primaryCustomer.customerType || "N/A"} />
              <DetailRow label="Total Services" value={String(addressData.primaryCustomer.services?.length || 0)} />
            </div>
          )}

          {dialogType === "service" && addressData?.primaryService && (
            <div className="space-y-3">
              <DetailRow label="Service ID" value={String(addressData.primaryService.serviceId)} />
              <DetailRow label="Service Name" value={addressData.primaryService.serviceName || "N/A"} />
              <DetailRow label="Service Type" value={addressData.primaryService.serviceType || "N/A"} />
              <DetailRow label="Status" value={addressData.primaryService.serviceStatus} />
              <DetailRow label="Speed" value={addressData.primaryService.speed || "N/A"} />
              <DetailRow label="VLAN" value={addressData.primaryService.vlan || "N/A"} />
              <DetailRow label="Activation Date" value={addressData.primaryService.activationDate || "N/A"} />
            </div>
          )}

          {dialogType === "cpe" && addressData?.ont && (
            <div className="space-y-3">
              <DetailRow label="ONT ID" value={String(addressData.ont.ontId)} />
              <DetailRow label="Model" value={addressData.ont.model || "N/A"} />
              <DetailRow label="Serial Number" value={addressData.ont.ontSerial || "N/A"} />
              <DetailRow label="Status" value={addressData.ont.status} />
              <DetailRow label="Port Instance ID" value={String(addressData.ont.portInstId)} />
              <DetailRow label="Equipment Instance ID" value={String(addressData.ont.equipInstId)} />
            </div>
          )}

          {dialogType === "olt" && selectedOlt && (
            <div className="space-y-3">
              <DetailRow label="Name" value={selectedOlt.name} />
              <DetailRow label="Type" value={selectedOlt.type} />
              <DetailRow label="Status" value={selectedOlt.status} />
              <DetailRow label="Equipment ID" value={selectedOlt.id} />
              {selectedOlt.data && Object.entries(selectedOlt.data).length > 0 && (
                <>
                  <DetailRow label="Total Connections" value={String(Object.keys(selectedOlt.data).length)} />
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Equipment Hierarchy Modal */}
      <EquipmentHierarchyModal
        isOpen={hierarchyModalOpen}
        onClose={() => setHierarchyModalOpen(false)}
        portInstId={selectedEquipment?.portInstId || null}
        equipmentName={selectedEquipment?.name || ""}
      />
    </div>
  )
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
