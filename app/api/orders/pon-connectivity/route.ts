import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ontPortId = searchParams.get("ontPortId")
  const ontInstId = searchParams.get("ontInstId")

  console.log("[v0] PON Connectivity API - ontPortId:", ontPortId, "ontInstId:", ontInstId)

  if (!ontPortId || !ontInstId) {
    return NextResponse.json(
      { error: "Missing required parameters: ontPortId and ontInstId" },
      { status: 400 }
    )
  }

  try {
    const externalUrl = `https://api-dv.brightspeed.com/brspd/nextgenfiber/fetchPONConnectivity?ontPortId=${encodeURIComponent(ontPortId)}&ontInstId=${encodeURIComponent(ontInstId)}`

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
        { error: `External API Error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[v0] PON Connectivity data received successfully")

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] PON Connectivity API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch PON connectivity" },
      { status: 500 }
    )
  }
}
