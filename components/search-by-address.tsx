"use client"

import { useState, useCallback } from "react"
import {
  Search,
  MapPin,
  Building2,
  Home,
  Loader2,
  AlertCircle,
  Server,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCurrentEnvironment } from "@/lib/env-config"

const currentEnv = getCurrentEnvironment()

interface AddressResult {
  id: string
  address: string
  city: string
  state: string
  zip: string
  type: "residential" | "commercial" | "mdu"
  serviceStatus: "active" | "pending" | "available" | "unavailable"
  equipmentId?: string
}

export function SearchByAddress() {
  const [streetAddress, setStreetAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [addressType, setAddressType] = useState<string>("all")
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AddressResult[] | null>(null)

  const handleSearch = useCallback(async () => {
    if (!streetAddress.trim() && !city.trim() && !zip.trim()) {
      setError("Please enter at least one search criteria")
      return
    }

    setIsSearching(true)
    setError(null)
    setResults(null)

    try {
      // TODO: Replace with actual API call
      // const params = { streetAddress, city, state, zip, addressType }
      // const response = await fetchAddressSearch(params)
      
      // Simulated delay for demo
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      // For now, show no results message since API is not implemented
      setResults([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search addresses")
      setResults(null)
    } finally {
      setIsSearching(false)
    }
  }, [streetAddress, city, zip])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      case "pending":
        return "border-amber-400/40 text-amber-600 dark:text-amber-400 bg-amber-400/10"
      case "available":
        return "border-sky-400/40 text-sky-600 dark:text-sky-400 bg-sky-400/10"
      case "unavailable":
        return "border-zinc-400/40 text-zinc-600 dark:text-zinc-400 bg-zinc-400/10"
      default:
        return "border-zinc-400/40 text-zinc-600 dark:text-zinc-400"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "residential":
        return Home
      case "commercial":
        return Building2
      case "mdu":
        return Building2
      default:
        return MapPin
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Search by Address
            </CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase">
              ENV: {currentEnv}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Street Address..."
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-9"
              />
            </div>
            <Input
              placeholder="City..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-9"
            />
            <div className="flex gap-2">
              <Input
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-9 w-20"
              />
              <Input
                placeholder="ZIP"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-9 flex-1"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={addressType} onValueChange={setAddressType}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Address Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="mdu">MDU (Multi-Dwelling)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isSearching} className="h-9">
              {isSearching ? (
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
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {isSearching ? (
        <Card className="rounded-xl border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Searching Addresses</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Looking up address information...
            </p>
          </CardContent>
        </Card>
      ) : results === null ? (
        <Card className="rounded-xl border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Search for an Address</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Enter street address, city, state, or ZIP code to search for service locations
              and view associated equipment.
            </p>
          </CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card className="rounded-xl border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 mb-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No Results Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              No addresses match your search criteria. Please try different search terms or check your input.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">
              Search Results ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => {
                const TypeIcon = getTypeIcon(result.type)
                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <TypeIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{result.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.city}, {result.state} {result.zip}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {result.equipmentId && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Server className="h-3 w-3" />
                          {result.equipmentId}
                        </div>
                      )}
                      <Badge variant="outline" className={getStatusColor(result.serviceStatus)}>
                        {result.serviceStatus}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
