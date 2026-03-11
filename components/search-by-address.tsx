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
  Cable,
  Zap,
  X,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getCurrentEnvironment } from "@/lib/env-config"
import {
  fetchAddressDetails,
  fetchNextConnection,
  fetchEquipmentConnection,
  getMockAddressDetails,
  getMockNextConnection,
  getMockEquipmentConnection,
  type AddressDetailsResponse,
  type NextConnectionResponse,
  type EquipmentConnectionResponse,
  type ONTPort,
  type DropTerminalPort,
} from "@/lib/api/address-api"

const currentEnv = getCurrentEnvironment()

// Flow steps in order
type FlowStep = "search" | "home" | "ont" | "drop-terminal" | "fdh" | "olt" | "olt-hierarchy"

interface FlowState {
  currentStep: FlowStep
  addressData: AddressDetailsResponse | null
  dropTerminalData: NextConnectionResponse | null
  fdhData: EquipmentConnectionResponse | null
  oltData: EquipmentConnectionResponse | null
  selectedOntPort: ONTPort | null
  selectedDtPort: DropTerminalPort | null
}

const stepOrder: FlowStep[] = ["search", "home", "ont", "drop-terminal", "fdh", "olt", "olt-hierarchy"]

const getStepIndex = (step: FlowStep) => stepOrder.indexOf(step)

export function SearchByAddress() {
  const [addressId, setAddressId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flowState, setFlowState] = useState<FlowState>({
    currentStep: "search",
    addressData: null,
    dropTerminalData: null,
    fdhData: null,
    oltData: null,
    selectedOntPort: null,
    selectedDtPort: null,
  })

  // Dialog states for detail popups
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [showCpeDialog, setShowCpeDialog] = useState(false)
  const [showOntDialog, setShowOntDialog] = useState(false)

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

      setFlowState({
        currentStep: "home",
        addressData: data,
        dropTerminalData: null,
        fdhData: null,
        oltData: null,
        selectedOntPort: null,
        selectedDtPort: null,
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
      
      setFlowState((prev) => ({
        ...prev,
        currentStep: "drop-terminal",
        dropTerminalData: data,
        selectedOntPort: port,
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
      
      setFlowState((prev) => ({
        ...prev,
        currentStep: data.equipmentType === "FDH" ? "fdh" : "olt",
        fdhData: data.equipmentType === "FDH" ? data : prev.fdhData,
        oltData: data.equipmentType === "OLT" ? data : prev.oltData,
        selectedDtPort: port,
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
      // Fetch OLT connection from FDH
      const fdhEquip = flowState.fdhData.targetEquipment as { fdhInstId: number }
      const data = getMockEquipmentConnection(fdhEquip.fdhInstId, 0, "OLT")
      
      setFlowState((prev) => ({
        ...prev,
        currentStep: "olt",
        oltData: data,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch OLT connection")
    } finally {
      setIsLoading(false)
    }
  }, [flowState.fdhData])

  const navigateTo = (step: FlowStep) => {
    const currentIndex = getStepIndex(flowState.currentStep)
    const targetIndex = getStepIndex(step)
    
    if (targetIndex <= currentIndex) {
      setFlowState((prev) => ({ ...prev, currentStep: step }))
    }
  }

  const goNext = () => {
    const currentIndex = getStepIndex(flowState.currentStep)
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1]
      // Only allow navigation if data exists for the next step
      if (nextStep === "ont" && flowState.addressData?.ont) {
        setFlowState((prev) => ({ ...prev, currentStep: nextStep }))
      } else if (nextStep === "drop-terminal" && flowState.dropTerminalData) {
        setFlowState((prev) => ({ ...prev, currentStep: nextStep }))
      } else if (nextStep === "fdh" && flowState.fdhData) {
        setFlowState((prev) => ({ ...prev, currentStep: nextStep }))
      } else if (nextStep === "olt" && flowState.oltData) {
        setFlowState((prev) => ({ ...prev, currentStep: nextStep }))
      }
    }
  }

  const goPrev = () => {
    const currentIndex = getStepIndex(flowState.currentStep)
    if (currentIndex > 0) {
      setFlowState((prev) => ({ ...prev, currentStep: stepOrder[currentIndex - 1] }))
    }
  }

  const resetFlow = () => {
    setFlowState({
      currentStep: "search",
      addressData: null,
      dropTerminalData: null,
      fdhData: null,
      oltData: null,
      selectedOntPort: null,
      selectedDtPort: null,
    })
    setAddressId("")
    setError(null)
  }

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

  // Render search step
  const renderSearchStep = () => (
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
  )

  // Render home/address details step
  const renderHomeStep = () => {
    if (!flowState.addressData) return null
    const { customer, service, cpe, ont, address } = flowState.addressData

    return (
      <div className="space-y-6">
        {/* Navigation breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={resetFlow} className="h-8 px-2">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Home</span>
        </div>

        {/* Home visualization */}
        <div className="flex items-start gap-8 justify-center">
          {/* Home Icon with Address */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <Home className="h-12 w-12 text-primary" />
              </div>
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px]">
                HOME
              </Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground text-center max-w-[200px]">
              {address}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {/* Customer Card */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCustomerDialog(true)}
                    className="p-4 rounded-xl border-2 border-border/50 bg-card hover:bg-secondary/30 hover:border-primary/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Customer</p>
                        <p className="text-xs text-muted-foreground">{customer?.name || "N/A"}</p>
                      </div>
                    </div>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>Click to view customer details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Service Card */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowServiceDialog(true)}
                    className="p-4 rounded-xl border-2 border-border/50 bg-card hover:bg-secondary/30 hover:border-primary/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Wifi className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Service</p>
                        <p className="text-xs text-muted-foreground">{service?.serviceName || "N/A"}</p>
                      </div>
                    </div>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>Click to view service details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* CPE Card */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCpeDialog(true)}
                    className="p-4 rounded-xl border-2 border-border/50 bg-card hover:bg-secondary/30 hover:border-primary/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Router className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">CPE</p>
                        <p className="text-xs text-muted-foreground">{cpe?.model || "N/A"}</p>
                      </div>
                    </div>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>Click to view CPE details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* ONT Card - Navigates to ONT step */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFlowState((prev) => ({ ...prev, currentStep: "ont" }))}
              className="p-4 rounded-xl border-2 border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Box className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">ONT</p>
                  <p className="text-xs text-muted-foreground">{ont?.model || "N/A"}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-primary ml-auto" />
              </div>
            </motion.button>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={resetFlow} className="gap-2">
            <X className="h-4 w-4" />
            New Search
          </Button>
          {ont && (
            <Button onClick={() => setFlowState((prev) => ({ ...prev, currentStep: "ont" }))} className="gap-2">
              View ONT
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Render ONT step
  const renderOntStep = () => {
    const ont = flowState.addressData?.ont
    if (!ont) return null

    return (
      <div className="space-y-6">
        {/* Navigation breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Button variant="ghost" size="sm" onClick={resetFlow} className="h-8 px-2">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => navigateTo("home")} className="h-8 px-2">
            Home
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">ONT</span>
        </div>

        {/* ONT Device visualization */}
        <Card className="rounded-xl border-2 border-primary/30 max-w-2xl mx-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Box className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{ont.model}</CardTitle>
                  <p className="text-sm text-muted-foreground">Serial: {ont.serialNumber}</p>
                </div>
              </div>
              <Badge variant="outline" className={getStatusBadgeColor(ont.status)}>
                {ont.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click on a port to fetch the next connected device (Drop Terminal)
            </p>
            
            {/* ONT Ports */}
            <div className="flex gap-4 justify-center">
              {ont.ports.map((port) => (
                <motion.button
                  key={port.portId}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOntPortClick(port)}
                  disabled={isLoading}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    "bg-card hover:bg-secondary/50 cursor-pointer",
                    flowState.selectedOntPort?.portId === port.portId
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-primary/50"
                  )}
                >
                  <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", getPortStatusColor(port.status))}>
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-mono text-sm font-medium">{port.portName}</span>
                  <Badge variant="outline" className={cn("text-[10px]", getStatusBadgeColor(port.status))}>
                    {port.status}
                  </Badge>
                </motion.button>
              ))}
            </div>

            {isLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Fetching next connection...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={() => navigateTo("home")} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Button>
          {flowState.dropTerminalData && (
            <Button onClick={() => setFlowState((prev) => ({ ...prev, currentStep: "drop-terminal" }))} className="gap-2">
              View Drop Terminal
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Render Drop Terminal step
  const renderDropTerminalStep = () => {
    const dt = flowState.dropTerminalData?.dropTerminal
    if (!dt) return null

    return (
      <div className="space-y-6">
        {/* Navigation breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Button variant="ghost" size="sm" onClick={resetFlow} className="h-8 px-2">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => navigateTo("home")} className="h-8 px-2">
            Home
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => navigateTo("ont")} className="h-8 px-2">
            ONT
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Drop Terminal</span>
        </div>

        {/* Cable connection indicator */}
        {flowState.dropTerminalData?.cableName && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Cable className="h-4 w-4" />
            <span>Connected via: {flowState.dropTerminalData.cableName}</span>
          </div>
        )}

        {/* Drop Terminal visualization */}
        <Card className="rounded-xl border-2 border-amber-500/30 max-w-2xl mx-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Server className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">{dt.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Model: {dt.model || "N/A"}</p>
                </div>
              </div>
              <Badge variant="outline" className={getStatusBadgeColor(dt.status)}>
                {dt.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click on a port to fetch the connected FDH equipment
            </p>
            
            {/* Drop Terminal Ports */}
            <div className="grid grid-cols-4 gap-3">
              {dt.ports.map((port) => (
                <motion.button
                  key={port.portId}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDtPortClick(port)}
                  disabled={isLoading || !port.equipInstId}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    "bg-card cursor-pointer",
                    !port.equipInstId && "opacity-50 cursor-not-allowed",
                    flowState.selectedDtPort?.portId === port.portId
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-amber-500/50 hover:bg-secondary/50"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", getPortStatusColor(port.status))}>
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-mono text-xs font-medium">{port.portName}</span>
                  <Badge variant="outline" className={cn("text-[9px]", getStatusBadgeColor(port.status))}>
                    {port.status}
                  </Badge>
                </motion.button>
              ))}
            </div>

            {/* Port Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
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

            {isLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Fetching equipment connection...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={() => navigateTo("ont")} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to ONT
          </Button>
          {flowState.fdhData && (
            <Button onClick={() => setFlowState((prev) => ({ ...prev, currentStep: "fdh" }))} className="gap-2">
              View FDH
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Render FDH step
  const renderFdhStep = () => {
    const fdh = flowState.fdhData?.targetEquipment as { name: string; status: string; location?: string } | null
    if (!fdh) return null

    return (
      <div className="space-y-6">
        {/* Navigation breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Button variant="ghost" size="sm" onClick={resetFlow} className="h-8 px-2">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => navigateTo("home")} className="h-8 px-2">
            Home
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => navigateTo("ont")} className="h-8 px-2">
            ONT
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => navigateTo("drop-terminal")} className="h-8 px-2">
            Drop Terminal
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">FDH</span>
        </div>

        {/* Cable connection indicator */}
        {flowState.fdhData?.cableName && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Cable className="h-4 w-4" />
            <span>Connected via: {flowState.fdhData.cableName}</span>
          </div>
        )}

        {/* FDH visualization */}
        <Card className="rounded-xl border-2 border-cyan-500/30 max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Server className="h-7 w-7 text-cyan-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">{fdh.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Fiber Distribution Hub</p>
                  {fdh.location && (
                    <p className="text-xs text-muted-foreground">{fdh.location}</p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={getStatusBadgeColor(fdh.status)}>
                {fdh.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click below to view the connected OLT via Feeder Cable
            </p>
            
            <Button onClick={handleFdhToOlt} disabled={isLoading} className="w-full gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading OLT...
                </>
              ) : (
                <>
                  <Server className="h-4 w-4" />
                  View Connected OLT
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={() => navigateTo("drop-terminal")} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Drop Terminal
          </Button>
          {flowState.oltData && (
            <Button onClick={() => setFlowState((prev) => ({ ...prev, currentStep: "olt" }))} className="gap-2">
              View OLT
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Render OLT step
  const renderOltStep = () => {
    const olt = flowState.oltData?.targetEquipment as { name: string; status: string; location?: string } | null
    if (!olt) return null

    return (
      <div className="space-y-6">
        {/* Navigation breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Button variant="ghost" size="sm" onClick={resetFlow} className="h-8 px-2">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => navigateTo("home")} className="h-8 px-2">
            Home
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => navigateTo("ont")} className="h-8 px-2">
            ONT
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => navigateTo("drop-terminal")} className="h-8 px-2">
            DT
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => navigateTo("fdh")} className="h-8 px-2">
            FDH
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">OLT</span>
        </div>

        {/* Cable connection indicator */}
        {flowState.oltData?.cableName && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Cable className="h-4 w-4" />
            <span>Connected via: {flowState.oltData.cableName}</span>
          </div>
        )}

        {/* OLT visualization */}
        <Card className="rounded-xl border-2 border-emerald-500/30 max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Server className="h-7 w-7 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">{olt.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Optical Line Terminal</p>
                  {olt.location && (
                    <p className="text-xs text-muted-foreground">{olt.location}</p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={getStatusBadgeColor(olt.status)}>
                {olt.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This is the end of the address-based trace. Use "Search by Equipment" to explore the OLT hierarchy.
            </p>
            
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-foreground">
                  To view Racks, Shelves, Slots, and Ports inside this OLT, use the Equipment Search with name: <strong className="font-mono">{olt.name}</strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={() => navigateTo("fdh")} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to FDH
          </Button>
          <Button variant="outline" onClick={resetFlow} className="gap-2">
            <X className="h-4 w-4" />
            New Search
          </Button>
        </div>
      </div>
    )
  }

  // Detail dialogs
  const renderCustomerDialog = () => {
    const customer = flowState.addressData?.customer
    if (!customer) return null

    return (
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Customer Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{customer.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Account Number</span>
              <span className="font-mono text-sm">{customer.accountNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Phone</span>
              <span>{customer.phone || "N/A"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Email</span>
              <span>{customer.email || "N/A"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Service Address</span>
              <span className="text-right max-w-[200px]">{customer.serviceAddress}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const renderServiceDialog = () => {
    const service = flowState.addressData?.service
    if (!service) return null

    return (
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-emerald-500" />
              Service Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Service Name</span>
              <span className="font-medium">{service.serviceName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Service Type</span>
              <span>{service.serviceType}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className={getStatusBadgeColor(service.status)}>
                {service.status}
              </Badge>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Speed</span>
              <span>{service.speed || "N/A"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Plan</span>
              <span>{service.planName || "N/A"}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const renderCpeDialog = () => {
    const cpe = flowState.addressData?.cpe
    if (!cpe) return null

    return (
      <Dialog open={showCpeDialog} onOpenChange={setShowCpeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Router className="h-5 w-5 text-amber-500" />
              CPE Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{cpe.model}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Manufacturer</span>
              <span>{cpe.manufacturer}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className={getStatusBadgeColor(cpe.status)}>
                {cpe.status}
              </Badge>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">MAC Address</span>
              <span className="font-mono text-sm">{cpe.macAddress || "N/A"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Serial Number</span>
              <span className="font-mono text-sm">{cpe.serialNumber || "N/A"}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={flowState.currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {flowState.currentStep === "search" && renderSearchStep()}
          {flowState.currentStep === "home" && renderHomeStep()}
          {flowState.currentStep === "ont" && renderOntStep()}
          {flowState.currentStep === "drop-terminal" && renderDropTerminalStep()}
          {flowState.currentStep === "fdh" && renderFdhStep()}
          {flowState.currentStep === "olt" && renderOltStep()}
        </motion.div>
      </AnimatePresence>

      {/* Detail Dialogs */}
      {renderCustomerDialog()}
      {renderServiceDialog()}
      {renderCpeDialog()}

      {/* Error display */}
      {error && flowState.currentStep !== "search" && (
        <div className="max-w-2xl mx-auto">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}
