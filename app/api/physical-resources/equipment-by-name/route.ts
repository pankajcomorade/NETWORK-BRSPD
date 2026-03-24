import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const equipmentName = searchParams.get("equipmentName")

    if (!equipmentName) {
      return NextResponse.json(
        { error: "equipmentName parameter is required" },
        { status: 400 }
      )
    }

    console.log("[v0] Equipment By Name (Physical) - equipmentName:", equipmentName)

    const externalUrl = `https://api-dv.brightspeed.com/brspd/nextgenfiber/equipmentHierarchyDetails?equipmentName=${encodeURIComponent(equipmentName)}`
    console.log("[v0] Calling external API:", externalUrl)

    const response = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Equipment by name (physical) response received")

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    })
  } catch (error) {
    console.error("[v0] Equipment by name (physical) error:", error)
    return NextResponse.json(
      { error: "Failed to fetch equipment details" },
      { status: 500 }
    )
  }
}
