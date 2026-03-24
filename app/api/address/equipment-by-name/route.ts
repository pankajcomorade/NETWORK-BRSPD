import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const equipmentName = searchParams.get('equipmentName')

  if (!equipmentName) {
    return NextResponse.json(
      { error: 'Equipment name is required' },
      { status: 400 }
    )
  }

  try {
    console.log('[v0] Equipment by Name - equipmentName:', equipmentName)
    
    const externalUrl = `https://api-dv.brightspeed.com/brspd/nextgenfiber/equipmentHierarchyDetails?equipmentName=${encodeURIComponent(equipmentName)}`
    console.log('[v0] Calling external API:', externalUrl)
    
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`)
    }

    const data = await response.json()
    console.log('[v0] Equipment by name response received')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Equipment by name error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipment details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
