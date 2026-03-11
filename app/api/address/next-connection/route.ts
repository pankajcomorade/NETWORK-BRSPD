import { NextRequest, NextResponse } from "next/server"
import { getBaseUrl } from "@/lib/env-config"
import { getMockNextConnection } from "@/lib/api/address-api"

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
      console.log("[API] External API unavailable, returning mock data")
      return NextResponse.json(getMockNextConnection(parseInt(portInstId)))
    }

    const data = await response.json()
    
    if (!data || !data.dropTerminal) {
      return NextResponse.json(getMockNextConnection(parseInt(portInstId)))
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Next connection fetch error:", error)
    return NextResponse.json(getMockNextConnection(parseInt(portInstId)))
  }
}
