"use client"

import { useState, useCallback, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Equipment {
  nodeName: string
  nodeType: string
  nodeStatus: string
  address: string
  addressId: string
  latitude: string
  longitude: string
  wireCenter: string
}

export function PhysicalResourceDetail() {
  const [wireCenters, setWireCenters] = useState<string[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([])
  const [wcName, setWcName] = useState("")
  const [type, setType] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dropdownError, setDropdownError] = useState<string | null>(null)

  // Fetch wire centers and equipment types on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoadingDropdowns(true)
      setDropdownError(null)

      try {
        // Fetch wire centers
        console.log("[v0] Fetching wire centers...")
        const wcResponse = await fetch("/api/physical-resources/fetch-wire-centers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          cache: "no-store",
        })

        if (!wcResponse.ok) {
          throw new Error(`Failed to fetch wire centers: ${wcResponse.status}`)
        }

        const wcData = await wcResponse.json()
        console.log("[v0] Wire centers received:", wcData)

        if (wcData.wireCenters && Array.isArray(wcData.wireCenters)) {
          setWireCenters(wcData.wireCenters)
          // Set first wire center as default
          // if (wcData.wireCenters.length > 0) {
          //   setWcName(wcData.wireCenters[0])
          // }
        }

        // Fetch equipment types
        console.log("[v0] Fetching equipment types...")
        const etResponse = await fetch("/api/physical-resources/fetch-equipment-types", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          cache: "no-store",
        })

        if (!etResponse.ok) {
          throw new Error(`Failed to fetch equipment types: ${etResponse.status}`)
        }

        const etData = await etResponse.json()
        console.log("[v0] Equipment types received:", etData)

        if (etData.equipTypes && Array.isArray(etData.equipTypes)) {
          setEquipmentTypes(etData.equipTypes)
          // Set first type as default
          // if (etData.equipTypes.length > 0) {
          //   setType(etData.equipTypes[0])
          // }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load dropdown data"
        console.error("[v0] Dropdown fetch error:", err)
        setDropdownError(errorMessage)
      } finally {
        setIsLoadingDropdowns(false)
      }
    }

    fetchDropdownData()
  }, [])

  const handleFind = useCallback(async () => {
    if (!wcName.trim()) {
      setError("Please select WC Name")
      return
    }

    // if (!type.trim()) {
    //   setError("Please select Equipment Type")
    //   return
    // }

    setIsLoading(true)
    setError(null)
    setEquipment([])

    try {
      console.log("[v0] Fetching equipment with type:", type, "WC:", wcName)
      const url = `/api/physical-resources/fetch-equipments?WC=${encodeURIComponent(wcName)}${type}?&type=${encodeURIComponent(type)}:''`
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error("[v0] API error:", response.status, errorData)
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Equipment data received:", data)

      if (data.equipment && Array.isArray(data.equipment)) {
        setEquipment(data.equipment)
      } else if (Array.isArray(data)) {
        setEquipment(data)
      } else {
        setError("Unexpected response format")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch equipment"
      console.error("[v0] Error fetching equipment:", err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [wcName, type])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFind()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Physical Details</h2>
        <p className="text-muted-foreground mt-1">Search and view network equipment resources</p>
      </div>

      {/* Search Panel */}
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground">Search Equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dropdownError && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
              Warning: Could not load all dropdown options: {dropdownError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* WC Name Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">WC Name</label>
              {isLoadingDropdowns ? (
                <div className="flex items-center justify-center h-9 text-xs text-muted-foreground bg-secondary/20 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <Select value={wcName} onValueChange={setWcName} disabled={isLoading}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select WC Name" />
                  </SelectTrigger>
                  <SelectContent>
                    {wireCenters.map((wc) => (
                      <SelectItem key={wc} value={wc}>
                        {wc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Type Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              {isLoadingDropdowns ? (
                <div className="flex items-center justify-center h-9 text-xs text-muted-foreground bg-secondary/20 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <Select value={type} onValueChange={setType} disabled={isLoading}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((et) => (
                      <SelectItem key={et} value={et}>
                        {et}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Find Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-transparent">Find</label>
              <Button
                onClick={handleFind}
                disabled={isLoading || isLoadingDropdowns}
                className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Searching..." : "Find"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Panel */}
      {equipment.length > 0 && (
        <Card className="rounded-xl border-border/50">
          <CardHeader className="pb-3 flex">
            <CardTitle className="text-base text-foreground">
              Results ({equipment.length} found)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Node Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Node Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Node Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Address ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Latitude
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Longitude
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Wire Center
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border/20 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-foreground font-medium">
                        {item.nodeName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">
                          {item.nodeType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            item.nodeStatus?.toLowerCase() === "active" ||
                              item.nodeStatus?.toLowerCase() === "up" ||
                              item.nodeStatus?.toLowerCase() === "installed"
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                          )}
                        >
                          {item.nodeStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {item.address || "N/A"}
                      </td>
                      <td className="px-4 py-3 font-mono text-primary text-sm">
                        {item.addressId || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {item.latitude || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {item.longitude || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-foreground text-sm">
                        {item.wireCenter || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && equipment.length === 0 && !error && !isLoadingDropdowns && (
        <Card className="rounded-xl border-border/50 border-dashed">
          <CardContent className="p-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">
              Select WC Name and Equipment Type, then click Find to search for equipment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
