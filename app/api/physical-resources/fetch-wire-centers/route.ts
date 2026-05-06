import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching Wire Centers from external API")

    const externalUrl = "https://api-dv.brightspeed.com/brspd/nextgenfiber/fetchWireCenter"

    const response = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    console.log("External API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("External API error:", response.status, errorText)
      return NextResponse.json(
        { error: `External API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("Wire Centers received:", data)

    // Ensure the response has wireCenters array
    if (!data.wireCenters || !Array.isArray(data.wireCenters)) {
      console.error("Invalid response format:", data)
      return NextResponse.json(
        { error: "Invalid response format from external API" },
        { status: 500 }
      )
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error fetching wire centers:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch wire centers" },
      { status: 500 }
    )
  }
}
