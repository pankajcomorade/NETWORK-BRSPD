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
 * Fetch equipment hierarchy details from the API
 * @param params - Search parameters
 * @param env - Optional environment override
 * @returns Equipment hierarchy response
 */
export async function fetchEquipmentHierarchy(
  params: EquipmentSearchParams = DEFAULT_SEARCH_PARAMS,
  env?: Environment
): Promise<EquipmentHierarchyResponse> {
  const baseUrl = getBaseUrl(env)
  
  const queryParams = new URLSearchParams({
    equipmentName: params.equipmentName,
    equipCategory: params.equipCategory,
    ...(params.portInstId && { portInstId: params.portInstId.toString() }),
    ...(params.equipInstId && { equipInstId: params.equipInstId.toString() }),
  })

  const url = `${baseUrl}/brspd/nextgenfiber/equipmentHierarchyDetails?${queryParams}`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[Equipment API] Fetch error:", error)
    // Return mock data for development/testing when API is unavailable
    return getMockEquipmentHierarchy(params)
  }
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
                        { name: "P=001", type: "PORT", instanceID: 197873, erId: "200122", status: "ACTIVE", nodes: [] },
                        { name: "P=002", type: "PORT", instanceID: 197874, erId: "200123", status: "ACTIVE", nodes: [] },
                        { name: "P=003", type: "PORT", instanceID: 197875, erId: "200124", status: "WARNING", nodes: [] },
                        { name: "P=004", type: "PORT", instanceID: 197876, erId: "200125", status: "INACTIVE", nodes: [] },
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
                        { name: "P=001", type: "PORT", instanceID: 197877, erId: "200128", status: "ACTIVE", nodes: [] },
                        { name: "P=002", type: "PORT", instanceID: 197878, erId: "200129", status: "ACTIVE", nodes: [] },
                      ],
                    },
                  ],
                },
                {
                  name: "SL=003",
                  type: "SLOT",
                  instanceID: null,
                  erId: "200130",
                  status: "INACTIVE",
                  nodes: [],
                },
                {
                  name: "SL=004",
                  type: "SLOT",
                  instanceID: null,
                  erId: "200131",
                  status: "INACTIVE",
                  nodes: [],
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
                        { name: "P=001", type: "PORT", instanceID: 197879, erId: "200135", status: "ACTIVE", nodes: [] },
                        { name: "P=002", type: "PORT", instanceID: 197880, erId: "200136", status: "ACTIVE", nodes: [] },
                        { name: "P=003", type: "PORT", instanceID: 197881, erId: "200137", status: "ACTIVE", nodes: [] },
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
                        { name: "P=001", type: "PORT", instanceID: 197882, erId: "200140", status: "WARNING", nodes: [] },
                        { name: "P=002", type: "PORT", instanceID: 197883, erId: "200141", status: "INACTIVE", nodes: [] },
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
        NETWORKCARD: 4,
        PORT: 11,
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
