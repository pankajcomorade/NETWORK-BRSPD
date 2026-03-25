import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/equipment/typeahead-search
 * Typeahead search for equipment names
 * Query params:
 *   - equipmentName: Equipment name to search for (min 4 chars)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const equipmentName = searchParams.get("equipmentName")

    console.log("[v0] Typeahead Search API - equipmentName:", equipmentName)

    if (!equipmentName || equipmentName.length < 4) {
      return NextResponse.json(
        {
          error: "Equipment name must be at least 4 characters",
          results: [],
        },
        { status: 400 }
      )
    }

    // Call external API
    const externalUrl = `https://api-dv.brightspeed.com/brspd/nextgenfiber/equipmentNameSearch?equipmentName=${encodeURIComponent(
      equipmentName
    )}`

    console.log("[v0] Calling external typeahead API:", externalUrl)

    const response = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log("[v0] External API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[v0] External API error:", response.status, errorData)

      return NextResponse.json(
        {
          error: `External API error: ${response.status}`,
          results: [],
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[v0] Typeahead API response received, results count:", data?.length || 0)

    // Transform response for typeahead - assuming data is an array
    const results = Array.isArray(data)
      ? data.map((item: any) => ({
          nodeName: item.nodeName || "",
          nodeType: item.nodeType || "",
          nodeStatus: item.nodeStatus || "UNKNOWN",
          addressId: item.addressId || null,
          addressLine: item.addressLine || "",
        }))
      : []

    return NextResponse.json(
      {
        success: true,
        results,
        count: results.length,
      },
      { status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Typeahead search error:", errorMessage)

    return NextResponse.json(
      {
        error: "Failed to fetch equipment suggestions",
        details: errorMessage,
        results: [],
      },
      { status: 500 }
    )
  }
}
