"use client"

import React from "react"
import { Building2, Network, Wifi, MapPin, Home, Zap, Boxes, Package } from "lucide-react"

// Custom Splitter Icon Component
const SplitterIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 400 200"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Input line from left */}
    <line x1="20" y1="100" x2="100" y2="100" />
    
    {/* Splitter cone shape */}
    <path d="M 100 100 Q 150 80 180 60 L 180 140 Q 150 120 100 100" />
    
    {/* Output lines to right */}
    <line x1="180" y1="60" x2="380" y2="40" />
    <line x1="180" y1="100" x2="380" y2="100" />
    <line x1="180" y1="140" x2="380" y2="160" />
  </svg>
)

// Get icon for equipment type
export const getEquipmentIcon = (type?: string): React.ReactNode => {
  if (!type) return <Package className="h-6 w-6 text-primary" />

  const typeUpper = type.toUpperCase()

  switch (typeUpper) {
    case "RACK":
    case "RK":
      return <Boxes className="h-6 w-6 text-blue-500" />
    case "SHELF":
    case "SF":
      return <Building2 className="h-6 w-6 text-blue-600" />
    case "SLOT":
    case "SL":
      return <Zap className="h-6 w-6 text-amber-500" />
    case "SPLITTER":
    case "SP":
      return <SplitterIcon className="h-6 w-6 text-orange-600" />
    case "PORT":
    case "NC":
      return <Network className="h-6 w-6 text-blue-500" />
    case "NETWORK CARD":
      return <Network className="h-6 w-6 text-green-600" />
    case "OLT":
      return <Wifi className="h-6 w-6 text-purple-500" />
    case "FDH":
      return <MapPin className="h-6 w-6 text-red-500" />
    case "ONT":
      return <Home className="h-6 w-6 text-cyan-500" />
    default:
      return <Package className="h-6 w-6 text-primary" />
  }
}

// Get status color for ports and equipment (background + text for badges)
export const getPortStatusColor = (status: string): string => {
  const statusUpper = status?.toUpperCase?.() || ""

  if (statusUpper === "ACTIVE" || statusUpper === "BUSY") {
    return "bg-red-500/20 text-red-600 dark:text-red-400"
  } else if (statusUpper === "FREE") {
    return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
  } else if (statusUpper === "PENDING") {
    return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
  } else if (statusUpper === "RETIRED") {
    return "bg-blue-500/20 text-blue-600 dark:text-blue-400"
  }
  return "bg-amber-500/20 text-amber-600 dark:text-amber-400"
}
