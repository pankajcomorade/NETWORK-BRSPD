import { NextRequest, NextResponse } from "next/server"
import { getBaseUrl } from "@/lib/env-config"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const addressId = searchParams.get("addressId")

  if (!addressId) {
    return NextResponse.json(
      { error: "addressId is required" },
      { status: 400 }
    )
  }

  const baseUrl = getBaseUrl()
  const apiUrl = `${baseUrl}/brspd/nextgenfiber/fetchAddressDetails?addressId=${encodeURIComponent(addressId)}`

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
      return NextResponse.json(
        { error: `API returned ${response.status}: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Check if valid data was returned
    if (!data || (!data.address && (!data.customers || data.customers.length === 0))) {
      return NextResponse.json(
        { error: "No record found for the specified Address ID" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Address details fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch address details" },
      { status: 500 }
    )
  }
}
