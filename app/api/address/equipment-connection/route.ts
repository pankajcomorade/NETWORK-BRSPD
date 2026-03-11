import { NextRequest, NextResponse } from "next/server"
import { getBaseUrl } from "@/lib/env-config"
import { getMockEquipmentConnection } from "@/lib/api/address-api"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const equipInstId = searchParams.get("equipInstId")
  const portInstId = searchParams.get("portInstId")
  const equipmentType = (searchParams.get("equipmentType") || "FDH") as "FDH" | "OLT"

  if (!equipInstId || !portInstId) {
    return NextResponse.json(
      { error: "equipInstId and portInstId are required" },
      { status: 400 }
    )
  }

  const baseUrl = getBaseUrl()
  const apiUrl = `${baseUrl}/brspd/nextgenfiber/equipmentHierarchyDetails?equipInstId=${equipInstId}&portInstId=${portInstId}`

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
      return NextResponse.json(getMockEquipmentConnection(parseInt(equipInstId), parseInt(portInstId), equipmentType))
    }

    const data = await response.json()
    
    if (!data || !data.targetEquipment) {
      return NextResponse.json(getMockEquipmentConnection(parseInt(equipInstId), parseInt(portInstId), equipmentType))
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Equipment connection fetch error:", error)
    return NextResponse.json(getMockEquipmentConnection(parseInt(equipInstId), parseInt(portInstId), equipmentType))
  }
}
