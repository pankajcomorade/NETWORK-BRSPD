import { NextRequest, NextResponse } from "next/server"
import { getBaseUrl } from "@/lib/env-config"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const equipmentName = searchParams.get("equipmentName") || "BUFTNCXAH07"
  const equipCategory = searchParams.get("equipCategory") || "OLT"
  const portInstId = searchParams.get("portInstId") || "197873"
  const equipInstId = searchParams.get("equipInstId") || "12345678"

  const baseUrl = getBaseUrl()
  const apiUrl = `${baseUrl}/brspd/nextgenfiber/equipmentHierarchyDetails?equipmentName=${equipmentName}&equipCategory=${equipCategory}&portInstId=${portInstId}&equipInstId=${equipInstId}`

  console.log("[v0] Equipment API Request:", apiUrl)

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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
    console.log("[v0] Equipment API Success - Data received")
    
    return NextResponse.json(data)
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
