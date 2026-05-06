import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching Equipment Types from external API")

    const externalUrl = "https://api-dv.brightspeed.com/brspd/nextgenfiber/fetchEquipType"

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
    console.log("Equipment Types received:", data)

    // Ensure the response has equipTypes array
    if (!data.equipTypes || !Array.isArray(data.equipTypes)) {
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
    console.error("Error fetching equipment types:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch equipment types" },
      { status: 500 }
    )
  }
}
