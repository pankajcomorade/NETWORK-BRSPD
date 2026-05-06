import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const wc = searchParams.get("WC")

    console.log("Fetch Equipments - type:", type, "WC:", wc)

    if (!(wc || type)) {
      return NextResponse.json(
        { error: "Missing required parameters: WC" },
        { status: 400 }
      )
    }

    let externalUrl = `https://api-dv.brightspeed.com/brspd/nextgenfiber/fetchEquipments`
    if (wc) {
      externalUrl = externalUrl + `?WC=${encodeURIComponent(wc)}`
    }
    if (type) {
      externalUrl = externalUrl + `${wc ? '&' : '?'}type=${encodeURIComponent(type)}`
    }
    console.log("Calling external API:", externalUrl)

    const response = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log("External API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("External API error:", response.status, errorText)
      return NextResponse.json(
        { error: `External API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("Equipment data received:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch equipments error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch equipment" },
      { status: 500 }
    )
  }
}
