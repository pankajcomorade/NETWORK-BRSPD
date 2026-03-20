import { NextRequest, NextResponse } from "next/server"

/**
 * API route for searching equipment by name
 * This route provides a dedicated endpoint specifically for searching equipment
 * by equipment name (e.g., "BUFTNCXAH07"), avoiding conflicts with other endpoints
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const equipmentName = searchParams.get("equipmentName")
    const equipCategory = searchParams.get("equipCategory")

    console.log("[v0] Search Equipment by Name - equipmentName:", equipmentName, "equipCategory:", equipCategory)

    if (!equipmentName) {
      return NextResponse.json(
        { error: "Missing required parameter: equipmentName" },
        { status: 400 }
      )
    }

    // Call external API to search equipment by name
    const externalUrl = `https://api-dv.brightspeed.com/brspd/nextgenfiber/searchEquipmentByName?equipmentName=${encodeURIComponent(
      equipmentName
    )}${equipCategory && equipCategory !== "all" ? `&equipCategory=${encodeURIComponent(equipCategory)}` : ""}`

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
    console.log("[v0] Equipment search response received")

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Equipment search error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search equipment" },
      { status: 500 }
    )
  }
}
