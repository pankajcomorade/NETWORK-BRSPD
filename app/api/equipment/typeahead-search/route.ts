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

    console.log("Typeahead Search API - equipmentName:", equipmentName)

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

    console.log("Calling external typeahead API:", externalUrl)

    const response = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log("External API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error("External API error:", response.status, errorData)

      return NextResponse.json(
        {
          error: `External API error: ${response.status}`,
          results: [],
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("Typeahead API response received, results count:", data?.length || 0)
    console.log("First result sample:", data?.[0])

    // Transform response for typeahead - assuming data is an array
    const results = Array.isArray(data)
      ? data.map((item: any) => ({
          nodeName: item.nodeName || item.name || "",
          nodeType: item.nodeType || item.type || "",
          nodeStatus: item.nodeStatus || item.status || "UNKNOWN",
          addressId: item.addressId || null,
          addressLine: item.addressLine || item.address || "",
        }))
      : []

    console.log("Transformed results count:", results.length)
    console.log("First transformed result:", results?.[0])

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
    console.error("Typeahead search error:", errorMessage)

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
