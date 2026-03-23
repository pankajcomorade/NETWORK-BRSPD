import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const portInstId = searchParams.get("portInstId")

    console.log("[v0] Equipment Hierarchy Details - portInstId:", portInstId)

    if (!portInstId) {
      return NextResponse.json(
        { error: "Missing portInstId parameter" },
        { status: 400 }
      )
    }

    const externalUrl = `https://api-dv.brightspeed.com/brspd/nextgenfiber/equipmentHierarchyDetails?portInstId=${encodeURIComponent(portInstId)}`
    console.log("[v0] Calling external API:", externalUrl)

    const response = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log("[v0] Equipment Hierarchy API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Equipment Hierarchy API error:", response.status, errorText)
      return NextResponse.json(
        { error: `External API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[v0] Equipment hierarchy response received")

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Equipment hierarchy fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch equipment hierarchy" },
      { status: 500 }
    )
  }
}
