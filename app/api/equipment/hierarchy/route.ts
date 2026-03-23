import { NextRequest, NextResponse } from "next/server"

/**
 * API route for fetching equipment hierarchy details
 * This route provides detailed hierarchy information for a specific equipment
 * based on equipment name, instance ID, or port instance ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const equipmentName = searchParams.get("equipmentName")
    const equipInstId = searchParams.get("equipInstId")
    const portInstId = searchParams.get("portInstId")
    const equipCategory = searchParams.get("equipCategory")

    console.log("[v0] Equipment Hierarchy - equipmentName:", equipmentName, "equipInstId:", equipInstId, "portInstId:", portInstId)

    // Build query parameters for external API
    const queryParams = new URLSearchParams()

    if (equipmentName) {
      queryParams.set("equipmentName", equipmentName)
    }
    if (equipInstId) {
      queryParams.set("equipInstId", equipInstId)
    }
    if (portInstId) {
      queryParams.set("portInstId", portInstId)
    }
    if (equipCategory && equipCategory !== "all") {
      queryParams.set("equipCategory", equipCategory)
    }

    if (queryParams.toString().length === 0) {
      return NextResponse.json(
        { error: "Missing required parameters: provide at least one of equipmentName, equipInstId, or portInstId" },
        { status: 400 }
      )
    }

    const externalUrl = `https://api-dv.brightspeed.com/brspd/nextgenfiber/equipmentHierarchyDetails?${queryParams}`

    console.log("[v0] Calling external API:", externalUrl)

    const response = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log("[v0] External API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] External API error:", response.status, errorText)
      return NextResponse.json(
        { error: `External API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[v0] Equipment hierarchy response received")

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Equipment hierarchy error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch equipment hierarchy" },
      { status: 500 }
    )
  }
}
