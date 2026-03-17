import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderNum = searchParams.get("orderNum")

  if (!orderNum) {
    return NextResponse.json(
      { error: "orderNum parameter is required" },
      { status: 400 }
    )
  }

  const externalApiUrl = `https://api-dv.brightspeed.com/brspd/nextgenfiber/fetchOrderNum?orderNum=${encodeURIComponent(orderNum)}`

  console.log("[API Route] Fetching orders for orderNum:", orderNum)
  console.log("[API Route] External API URL:", externalApiUrl)

  try {
    const response = await fetch(externalApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    console.log("[API Route] External API Response Status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API Route] External API Error:", response.status, errorText)

      return NextResponse.json(
        {
          error: `External API Error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[API Route] Successfully fetched orders, count:", Array.isArray(data) ? data.length : data.orders?.length || 1)

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error) {
    console.error("[API Route] Fetch error:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch from external API",
      },
      { status: 500 }
    )
  }
}
