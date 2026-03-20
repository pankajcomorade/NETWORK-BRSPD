import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const equipInstId = searchParams.get("equipInstId")

    console.log("[v0] Equipment Hierarchy - equipInstId:", equipInstId)

    if (!equipInstId) {
      return NextResponse.json(
        { error: "Missing required parameter: equipInstId" },
        { status: 400 }
      )
    }

    const externalUrl = `https://api-dv.brightspeed.com/brspd/nextgenfiber/equipmentHierarchyDetails?equipInstId=${encodeURIComponent(equipInstId)}`

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
    console.log("[v0] Equipment Hierarchy response:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Equipment Hierarchy error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch equipment hierarchy details" },
      { status: 500 }
    )
  }
}
