"use client"

import React from "react"
import { Building2, Wifi, MapPin, Home, Cable, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface PONConnection {
  connectionId: number
  cableStrandName: string | null
  connectionStatus: string
  depth: number
  endpointA: {
    equipment: {
      name: string
      type: string
      instanceID: number
    }
  }
  endpointB: {
    equipment: {
      name: string
      type: string
      instanceID: number
    }
  }
}

interface NetworkTopologyProps {
  connections: PONConnection[]
}

export function NetworkTopology({ connections }: NetworkTopologyProps) {
  if (!connections || connections.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No connection data available for topology visualization</p>
      </div>
    )
  }

  // Build the network path from connections
  const nodes: Array<{
    name: string
    type: string
    position: number
    isCustomer?: boolean
  }> = []

  // Add the first endpoint of the first connection (usually OLT)
  if (connections[0]) {
    nodes.push({
      name: connections[0].endpointA.equipment.name,
      type: connections[0].endpointA.equipment.type,
      position: 0,
    })
  }

  // Add the chain of connections
  connections.forEach((conn, idx) => {
    // Add cable strand as a connector node
    if (conn.cableStrandName) {
      nodes.push({
        name: conn.cableStrandName,
        type: "CABLE",
        position: idx * 2 + 0.5,
      })
    }

    // Add endpoint B
    nodes.push({
      name: conn.endpointB.equipment.name,
      type: conn.endpointB.equipment.type,
      position: idx * 2 + 1,
    })
  })

  // Get icon for node type
  const getNodeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "OLT":
        return <Wifi className="h-5 w-5" />
      case "FDH":
        return <Building2 className="h-5 w-5" />
      case "SPLITTER":
      case "SP":
        return <TrendingUp className="h-5 w-5 rotate-45" />
      case "CABLE":
        return <Cable className="h-4 w-4" />
      case "ONT":
        return <Home className="h-5 w-5" />
      case "AP":
      case "AT":
        return <MapPin className="h-5 w-5" />
      default:
        return <Building2 className="h-5 w-5" />
    }
  }

  // Get color for node type
  const getNodeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case "OLT":
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-blue-300 dark:border-blue-700"
      case "FDH":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-300 dark:border-green-700"
      case "SPLITTER":
      case "SP":
        return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border-purple-300 dark:border-purple-700"
      case "CABLE":
        return "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700"
      case "ONT":
        return "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      case "AP":
      case "AT":
        return "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 border-amber-300 dark:border-amber-700"
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700"
    }
  }

  return (
    <div className="w-full overflow-x-auto py-8 px-4">
      <div className="flex items-center justify-center gap-3 min-w-max">
        {nodes.map((node, idx) => (
          <React.Fragment key={idx}>
            {/* Node */}
            <div
              className={cn(
                "flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 min-w-max",
                getNodeColor(node.type)
              )}
            >
              <div className="flex items-center gap-2">
                {getNodeIcon(node.type)}
                <div className="text-center">
                  <p className="font-semibold text-sm">{node.type}</p>
                  <p className="text-xs opacity-80 max-w-[80px] truncate">{node.name}</p>
                </div>
              </div>
            </div>

            {/* Arrow connector (not after last node) */}
            {idx < nodes.length - 1 && (
              <div className="text-lg font-bold text-muted-foreground">→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Customer node below splitter */}
      {connections.some((c) => c.endpointA.equipment.type === "SPLITTER" || c.endpointB.equipment.type === "SPLITTER" || c.endpointA.equipment.type === "SP" || c.endpointB.equipment.type === "SP") && (
        <div className="flex justify-center mt-8">
          <div className="text-muted-foreground text-sm mb-2">↓</div>
        </div>
      )}

      {connections.some((c) => c.endpointA.equipment.type === "SPLITTER" || c.endpointB.equipment.type === "SPLITTER" || c.endpointA.equipment.type === "SP" || c.endpointB.equipment.type === "SP") && (
        <div className="flex justify-center">
          <div className="px-4 py-3 rounded-lg border-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700">
            <p className="font-semibold text-sm">Customer</p>
          </div>
        </div>
      )}
    </div>
  )
}
