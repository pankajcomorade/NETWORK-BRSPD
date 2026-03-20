// Address Search API Service
import { getBaseUrl, type Environment } from "@/lib/env-config"

// Types based on actual API response structure
// GET /brspd/nextgenfiber/fetchAddressDetails?addressId={addressId}

export interface AddressCoordinates {
  lat: number
  lon: number
}

export interface AddressInfo {
  addressId: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string | null
  country: string | null
  coordinates: AddressCoordinates | null
  status: string | null
}

export interface ONTInfo {
  ontId: number
  ontSerial: string | null
  model: string | null
  status: string
  portInstId: number
  equipInstId: number
}

export interface ServiceInfo {
  serviceId: number
  serviceType: string | null
  serviceName: string | null
  serviceStatus: string
  speed: string | null
  vlan: string | null
  activationDate: string | null
  ont: ONTInfo | null
}

export interface CustomerInfo {
  customerId: string | null
  customerFirstName: string | null
  customerLastName: string | null
  customerType: string | null
  services: ServiceInfo[]
}

export interface AddressDetailsAPIResponse {
  address: AddressInfo | null
  customers: CustomerInfo[]
}

// Transformed response for UI consumption
export interface AddressDetailsResponse {
  address: AddressInfo | null
  customers: CustomerInfo[]
  // Computed helpers for easier UI access
  primaryCustomer: CustomerInfo | null
  primaryService: ServiceInfo | null
  ont: ONTInfo | null
}

export interface DropTerminalPort {
  portId: string
  portInstId: number
  portName: string
  status: "Active" | "Pending" | "Free" | "Retired"
  equipInstId?: number
}

export interface DropTerminalInfo {
  dropTerminalId: string
  dropTerminalInstId: number
  name: string
  model?: string
  status: "Active" | "Pending" | "Offline"
  ports: DropTerminalPort[]
}

export interface NextConnectionResponse {
  dropTerminal: DropTerminalInfo | null
  cableName?: string
  cableType?: "Drop" | "Distribution" | "Feeder"
  // New PON Connectivity fields
  link?: {
    peer?: any
    cable?: { name: string }
    status?: string
  }
  error?: string
}

export interface FDHInfo {
  fdhId: string
  fdhInstId: number
  name: string
  status: "Active" | "Pending" | "Offline"
  location?: string
}

export interface OLTInfo {
  oltId: string
  oltInstId: number
  name: string
  status: "Active" | "Pending" | "Offline"
  location?: string
}

export interface EquipmentConnectionResponse {
  sourceEquipment: string
  targetEquipment: FDHInfo | OLTInfo | null
  cableName?: string
  cableType?: "Distribution" | "Feeder"
  equipmentType: "FDH" | "OLT"
}

// PON Connectivity response types
export interface PONEndpoint {
  side: "A" | "B"
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

export interface PONConnection {
  connectionId: number
  cableStrandName: string | null
  connectionStatus: string
  endpointA: PONEndpoint
  endpointB: PONEndpoint
}

export interface PONConnectivityResponse {
  ponConnection: {
    inputId: number
    linkId: number | null
    type: string
    status: string
    connections: PONConnection[]
  }
}

export interface EquipmentHierarchyDetailsResponse {
  equipmentInstId: number
  equipmentName: string
  equipmentType: string
  portInstId: number
  portName: string
  portStatus: string
  hierarchy: any
}

/**
 * Transform raw API response to UI-friendly format
 */
function transformAddressResponse(raw: AddressDetailsAPIResponse): AddressDetailsResponse {
  const primaryCustomer = raw.customers?.[0] || null
  const primaryService = primaryCustomer?.services?.[0] || null
  const ont = primaryService?.ont || null

  return {
    address: raw.address,
    customers: raw.customers || [],
    primaryCustomer,
    primaryService,
    ont,
  }
}

/**
 * Fetch address details from the API
 * Returns address, customer, service, and ONT information for a given address ID
 */
export async function fetchAddressDetails(
  addressId: string
): Promise<AddressDetailsResponse> {
  const url = `/api/address/details?addressId=${encodeURIComponent(addressId)}&_t=${Date.now()}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API Error: ${response.status}`)
  }

  const data: AddressDetailsAPIResponse = await response.json()
  return transformAddressResponse(data)
}

/**
 * Fetch next connection from ONT port
 * Returns Drop Terminal information
 */
export async function fetchNextConnection(
  portInstId: number
): Promise<NextConnectionResponse> {
  const url = `/api/address/next-connection?portInstId=${portInstId}&_t=${Date.now()}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch equipment hierarchy details
 * Returns FDH or OLT information from Drop Terminal port
 */
export async function fetchEquipmentConnection(
  equipInstId: number,
  portInstId: number
): Promise<EquipmentConnectionResponse> {
  const url = `/api/address/equipment-connection?equipInstId=${equipInstId}&portInstId=${portInstId}&_t=${Date.now()}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch PON connectivity details
 * Returns connections with source and destination equipment details
 */
export async function fetchPONConnectivity(
  ontPortId: number,
  ontInstId: number
): Promise<PONConnectivityResponse> {
  const url = `/api/address/pon-connectivity?ontPortId=${ontPortId}&ontInstId=${ontInstId}&_t=${Date.now()}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch equipment hierarchy details
 * Returns detailed hierarchy information for a specific equipment and port
 */
export async function fetchEquipmentHierarchyDetails(
  equipInstId: number,
  portInstId: number
): Promise<EquipmentHierarchyDetailsResponse> {
  const url = `/api/address/equipment-hierarchy?equipInstId=${equipInstId}&portInstId=${portInstId}&_t=${Date.now()}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API Error: ${response.status}`)
  }

  return response.json()
}

// Mock data generators removed - using real API only
