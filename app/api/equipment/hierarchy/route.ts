import { NextRequest, NextResponse } from "next/server"
import { getBaseUrl, getCurrentEnvironment } from "@/lib/env-config"

// Disable static generation for this route
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const equipmentName = searchParams.get("equipmentName")
  const equipCategory = searchParams.get("equipCategory")
  const portInstId = searchParams.get("portInstId")
  const equipInstId = searchParams.get("equipInstId")

  const baseUrl = getBaseUrl()
  const currentEnv = getCurrentEnvironment()
  
  // Build query string dynamically - only include params that are provided
  const queryParams = new URLSearchParams()
  if (equipmentName) queryParams.set("equipmentName", equipmentName)
  if (equipCategory) queryParams.set("equipCategory", equipCategory)
  if (portInstId) queryParams.set("portInstId", portInstId)
  if (equipInstId) queryParams.set("equipInstId", equipInstId)
  
  const apiUrl = `${baseUrl}/brspd/nextgenfiber/equipmentHierarchyDetails?${queryParams.toString()}`

  console.log("[API Route] Environment:", currentEnv)
  console.log("[API Route] Timestamp:", new Date().toISOString())
  console.log("[API Route] External API URL:", apiUrl)

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      // Disable caching to ensure fresh data
      cache: "no-store",
    })

    console.log("[v0] Equipment API Response Status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Equipment API Error:", response.status, errorText)
      
      return NextResponse.json(
        { 
          error: `API Error: ${response.status} ${response.statusText}`,
          details: errorText,
          requestUrl: apiUrl 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[API Route] Success - Data received for:", data.equipment?.name || "unknown")
    
    // Return with no-cache headers
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error) {
    console.error("[v0] Equipment API Fetch Error:", error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to fetch from external API",
        requestUrl: apiUrl 
      },
      { status: 500 }
    )
  }
}
