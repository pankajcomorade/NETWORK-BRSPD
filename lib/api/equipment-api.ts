// Equipment Hierarchy API Service
import { getBaseUrl, type Environment } from "@/lib/env-config"

// Types based on API response structure
export interface EquipmentNode {
  name: string
  type: "OLT" | "FDH" | "AP" | "RACK" | "SHELF" | "SLOT" | "NETWORKCARD" | "PORT"
  instanceID: number | null
  erId: string
  status: "ACTIVE" | "INACTIVE" | "WARNING" | "MAINTENANCE"
  nodes: EquipmentNode[]
}

export interface EquipmentHierarchyResponse {
  equipment: EquipmentNode
  summary: {
    countsByType: Record<string, number>
    totalNodes: number
  }
}

export interface EquipmentSearchParams {
  equipmentName: string
  equipCategory: "OLT" | "FDH" | "AP"
  portInstId?: number
  equipInstId?: number
}

// Default hardcoded params for initial implementation
export const DEFAULT_SEARCH_PARAMS: EquipmentSearchParams = {
  equipmentName: "BUFTNCXAH07",
  equipCategory: "OLT",
  portInstId: 197873,
  equipInstId: 12345678,
}

/**
 * Fetch equipment hierarchy details from the API via internal proxy route
 * This avoids CORS issues by routing through Next.js API route
 * @param params - Search parameters
 * @param useMockOnError - Whether to fallback to mock data on error (default: false)
 * @returns Equipment hierarchy response
 */
export async function fetchEquipmentHierarchy(
  params: EquipmentSearchParams = DEFAULT_SEARCH_PARAMS,
  useMockOnError: boolean = false
): Promise<EquipmentHierarchyResponse> {
  const queryParams = new URLSearchParams({
    equipmentName: params.equipmentName,
    equipCategory: params.equipCategory,
    ...(params.portInstId && { portInstId: params.portInstId.toString() }),
    ...(params.equipInstId && { equipInstId: params.equipInstId.toString() }),
  })

  // Add timestamp to bust any browser cache
  queryParams.set("_t", Date.now().toString())

  // Use internal API route to avoid CORS issues
  const url = `/api/equipment/hierarchy?${queryParams}`

  console.log("[v0] Fetching equipment hierarchy at", new Date().toISOString())
  console.log("[v0] Request URL:", url)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    },
    // Disable caching to ensure fresh data on each search
    cache: "no-store",
    next: { revalidate: 0 },
  })

  console.log("[v0] API Response status:", response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("[v0] API Error:", errorData)
    
    if (useMockOnError) {
      console.log("[v0] Falling back to mock data")
      return getMockEquipmentHierarchy(params)
    }
    
    throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  console.log("[v0] API Success - Equipment data received:", data.equipment?.name)
  
  return data
}

/**
 * Mock data for development/testing when API is unavailable
 */
function getMockEquipmentHierarchy(params: EquipmentSearchParams): EquipmentHierarchyResponse {
  return {
    equipment: {
      name: params.equipmentName,
      type: params.equipCategory,
      instanceID: 197670,
      erId: "200117",
      status: "ACTIVE",
      nodes: [
        {
          name: "RK=001",
          type: "RACK",
          instanceID: null,
          erId: "200118",
          status: "ACTIVE",
          nodes: [
            {
              name: "SF=001",
              type: "SHELF",
              instanceID: null,
              erId: "200119",
              status: "ACTIVE",
              nodes: [
                {
                  name: "SL=001",
                  type: "SLOT",
                  instanceID: null,
                  erId: "200120",
                  status: "ACTIVE",
                  nodes: [
                    {
                      name: "NC=001",
                      type: "NETWORKCARD",
                      instanceID: null,
                      erId: "200121",
                      status: "ACTIVE",
                      nodes: [
                        { name: "PP=001", type: "PORT", instanceID: 197873, erId: "200122", status: "ACTIVE", nodes: [] },
                        { name: "PP=002", type: "PORT", instanceID: 197874, erId: "200123", status: "ACTIVE", nodes: [] },
                        { name: "PP=003", type: "PORT", instanceID: 197875, erId: "200124", status: "WARNING", nodes: [] },
                        { name: "PP=004", type: "PORT", instanceID: 197876, erId: "200125", status: "INACTIVE", nodes: [] },
                      ],
                    },
                  ],
                },
                {
                  name: "SL=002",
                  type: "SLOT",
                  instanceID: null,
                  erId: "200126",
                  status: "ACTIVE",
                  nodes: [
                    {
                      name: "NC=002",
                      type: "NETWORKCARD",
                      instanceID: null,
                      erId: "200127",
                      status: "ACTIVE",
                      nodes: [
                        { name: "PP=001", type: "PORT", instanceID: 197877, erId: "200128", status: "ACTIVE", nodes: [] },
                        { name: "PP=002", type: "PORT", instanceID: 197878, erId: "200129", status: "ACTIVE", nodes: [] },
                      ],
                    },
                  ],
                },
                {
                  name: "SL=003",
                  type: "SLOT",
                  instanceID: null,
                  erId: "200130",
                  status: "ACTIVE",
                  nodes: [
                    {
                      name: "NC=001",
                      type: "NETWORKCARD",
                      instanceID: null,
                      erId: "200150",
                      status: "ACTIVE",
                      nodes: [
                        { name: "PP=001", type: "PORT", instanceID: 197884, erId: "200151", status: "ACTIVE", nodes: [] },
                        { name: "PP=002", type: "PORT", instanceID: 197885, erId: "200152", status: "ACTIVE", nodes: [] },
                        { name: "PP=003", type: "PORT", instanceID: 197886, erId: "200153", status: "WARNING", nodes: [] },
                      ],
                    },
                  ],
                },
                {
                  name: "SL=004",
                  type: "SLOT",
                  instanceID: null,
                  erId: "200131",
                  status: "ACTIVE",
                  nodes: [
                    {
                      name: "NC=001",
                      type: "NETWORKCARD",
                      instanceID: null,
                      erId: "200160",
                      status: "ACTIVE",
                      nodes: [
                        { name: "PP=001", type: "PORT", instanceID: 197887, erId: "200161", status: "ACTIVE", nodes: [] },
                        { name: "PP=002", type: "PORT", instanceID: 197888, erId: "200162", status: "INACTIVE", nodes: [] },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: "SF=002",
              type: "SHELF",
              instanceID: null,
              erId: "200132",
              status: "ACTIVE",
              nodes: [
                {
                  name: "SL=001",
                  type: "SLOT",
                  instanceID: null,
                  erId: "200133",
                  status: "ACTIVE",
                  nodes: [
                    {
                      name: "NC=001",
                      type: "NETWORKCARD",
                      instanceID: null,
                      erId: "200134",
                      status: "ACTIVE",
                      nodes: [
                        { name: "PP=001", type: "PORT", instanceID: 197879, erId: "200135", status: "ACTIVE", nodes: [] },
                        { name: "PP=002", type: "PORT", instanceID: 197880, erId: "200136", status: "ACTIVE", nodes: [] },
                        { name: "PP=003", type: "PORT", instanceID: 197881, erId: "200137", status: "ACTIVE", nodes: [] },
                      ],
                    },
                  ],
                },
                {
                  name: "SL=002",
                  type: "SLOT",
                  instanceID: null,
                  erId: "200138",
                  status: "ACTIVE",
                  nodes: [
                    {
                      name: "NC=002",
                      type: "NETWORKCARD",
                      instanceID: null,
                      erId: "200139",
                      status: "WARNING",
                      nodes: [
                        { name: "PP=001", type: "PORT", instanceID: 197882, erId: "200140", status: "WARNING", nodes: [] },
                        { name: "PP=002", type: "PORT", instanceID: 197883, erId: "200141", status: "INACTIVE", nodes: [] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    summary: {
      countsByType: {
        OLT: 1,
        RACK: 1,
        SHELF: 2,
        SLOT: 6,
        NETWORKCARD: 6,
        PORT: 16,
      },
      totalNodes: 25,
    },
  }
}

/**
 * Calculate summary statistics from equipment hierarchy
 */
export function calculateHierarchySummary(node: EquipmentNode): Record<string, number> {
  const counts: Record<string, number> = {}
  
  function traverse(n: EquipmentNode) {
    counts[n.type] = (counts[n.type] || 0) + 1
    n.nodes.forEach(traverse)
  }
  
  traverse(node)
  return counts
}
