import { NextRequest, NextResponse } from "next/server"
import { getBaseUrl } from "@/lib/env-config"
import { getMockAddressDetails } from "@/lib/api/address-api"

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
      // Return mock data for development when API is unavailable
      console.log("[API] External API unavailable, returning mock data")
      return NextResponse.json(getMockAddressDetails(addressId))
    }

    const data = await response.json()
    
    // If API returns empty/null, return mock data
    if (!data || !data.customer) {
      return NextResponse.json(getMockAddressDetails(addressId))
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Address details fetch error:", error)
    // Return mock data on error for development
    return NextResponse.json(getMockAddressDetails(addressId))
  }
}
