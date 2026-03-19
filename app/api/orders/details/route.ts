import { NextRequest, NextResponse } from "next/server"

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-dv.brightspeed.com"
}

function getCurrentEnvironment(): string {
  return process.env.NODE_ENV === "production" ? "Production" : "Development"
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const orderNum = searchParams.get("orderNum")
  const lci = searchParams.get("lci")

  const baseUrl = getBaseUrl()
  const currentEnv = getCurrentEnvironment()

  // Build query string with provided parameters only
  const queryParams = new URLSearchParams()
  if (orderNum) queryParams.set("orderNum", orderNum)
  if (lci) queryParams.set("lci", lci)

  const apiUrl = `${baseUrl}/brspd/nextgenfiber/extractOrderDetails?${queryParams.toString()}`

  console.log("[API Route] Environment:", currentEnv)
  console.log("[API Route] Timestamp:", new Date().toISOString())
  console.log("[API Route] External API URL:", apiUrl)

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      cache: "no-store",
    })

    console.log("[v0] Order Details API Response Status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Order Details API Error:", response.status, errorText)

      return NextResponse.json(
        {
          error: `API Error: ${response.status} ${response.statusText}`,
          details: errorText,
          requestUrl: apiUrl,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[API Route] Success - Order details received")

    // Return with no-cache headers
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error) {
    console.error("[v0] Order Details API Fetch Error:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch from external API",
        requestUrl: apiUrl,
      },
      { status: 500 }
    )
  }
}
