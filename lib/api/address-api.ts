// Address Search API Service
import { getBaseUrl, type Environment } from "@/lib/env-config"

// Types based on wireframe flow
export interface CustomerInfo {
  customerId: string
  name: string
  accountNumber: string
  phone?: string
  email?: string
  serviceAddress: string
}

export interface ServiceInfo {
  serviceId: string
  serviceName: string
  serviceType: string
  status: "Active" | "Pending" | "Suspended" | "Inactive"
  speed?: string
  planName?: string
}

export interface CPEInfo {
  cpeId: string
  model: string
  manufacturer: string
  macAddress?: string
  serialNumber?: string
  status: "Online" | "Offline" | "Pending"
}

export interface ONTPort {
  portId: string
  portInstId: number
  portName: string
  status: "Active" | "Pending" | "Free" | "Retired"
}

export interface ONTInfo {
  ontId: string
  ontInstId: number
  model: string
  serialNumber: string
  status: "Active" | "Pending" | "Offline"
  ports: ONTPort[]
}

export interface AddressDetailsResponse {
  addressId: string
  address: string
  customer: CustomerInfo | null
  service: ServiceInfo | null
  cpe: CPEInfo | null
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

/**
 * Fetch address details from the API
 * Returns customer, service, CPE, and ONT information for a given address ID
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

  return response.json()
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

// Mock data generators for development
export function getMockAddressDetails(addressId: string): AddressDetailsResponse {
  return {
    addressId,
    address: "123 Main Street, Buffalo, NY 14201",
    customer: {
      customerId: "CUST-" + addressId,
      name: "John Smith",
      accountNumber: "ACC-123456789",
      phone: "(716) 555-0123",
      email: "john.smith@email.com",
      serviceAddress: "123 Main Street, Buffalo, NY 14201",
    },
    service: {
      serviceId: "SVC-" + addressId,
      serviceName: "Fiber Internet",
      serviceType: "Residential Fiber",
      status: "Active",
      speed: "1 Gbps",
      planName: "Brightspeed Fiber 1G",
    },
    cpe: {
      cpeId: "CPE-" + addressId,
      model: "RAX50",
      manufacturer: "NETGEAR",
      macAddress: "AA:BB:CC:DD:EE:FF",
      serialNumber: "SN-12345678",
      status: "Online",
    },
    ont: {
      ontId: "ONT-" + addressId,
      ontInstId: 987654,
      model: "GP1100X",
      serialNumber: "ONT-SN-87654321",
      status: "Active",
      ports: [
        { portId: "P1", portInstId: 197873, portName: "GE1", status: "Active" },
        { portId: "P2", portInstId: 197874, portName: "GE2", status: "Free" },
      ],
    },
  }
}

export function getMockNextConnection(portInstId: number): NextConnectionResponse {
  return {
    dropTerminal: {
      dropTerminalId: "DT-" + portInstId,
      dropTerminalInstId: 456789,
      name: "DT-MAIN-001",
      model: "DT-4P",
      status: "Active",
      ports: [
        { portId: "DP1", portInstId: 300001, portName: "P1", status: "Active", equipInstId: 12345 },
        { portId: "DP2", portInstId: 300002, portName: "P2", status: "Active", equipInstId: 12345 },
        { portId: "DP3", portInstId: 300003, portName: "P3", status: "Free" },
        { portId: "DP4", portInstId: 300004, portName: "P4", status: "Pending" },
      ],
    },
    cableName: "Drop Cable DC-001",
    cableType: "Drop",
  }
}

export function getMockEquipmentConnection(
  equipInstId: number,
  portInstId: number,
  type: "FDH" | "OLT"
): EquipmentConnectionResponse {
  if (type === "FDH") {
    return {
      sourceEquipment: "Drop Terminal",
      targetEquipment: {
        fdhId: "FDH-" + equipInstId,
        fdhInstId: equipInstId,
        name: "FDH-BUFFALO-001",
        status: "Active",
        location: "Buffalo Central Office",
      } as FDHInfo,
      cableName: "Distribution Cable DIST-001",
      cableType: "Distribution",
      equipmentType: "FDH",
    }
  }
  return {
    sourceEquipment: "FDH",
    targetEquipment: {
      oltId: "OLT-" + equipInstId,
      oltInstId: equipInstId,
      name: "BUFTNCXAH07",
      status: "Active",
      location: "Buffalo Main Hub",
    } as OLTInfo,
    cableName: "Feeder Cable FDR-001",
    cableType: "Feeder",
    equipmentType: "OLT",
  }
}
