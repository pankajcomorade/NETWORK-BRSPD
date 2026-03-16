import { NextRequest, NextResponse } from "next/server"
import { getBaseUrl } from "@/lib/env-config"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const portInstId = searchParams.get("portInstId")

  if (!portInstId) {
    return NextResponse.json(
      { error: "portInstId is required" },
      { status: 400 }
    )
  }

  const baseUrl = getBaseUrl()
  const apiUrl = `${baseUrl}/brspd/nextgenfiber/fetchNextConnection?portInstId=${portInstId}`

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] Next connection error:", response.status, errorText)
      return NextResponse.json(
        { error: `API Error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[API] Next connection response received for portInstId:", portInstId, "Data:", data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Next connection fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch connection data" },
      { status: 500 }
    )
  }
}
