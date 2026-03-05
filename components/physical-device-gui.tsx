'use client'

import { sampleOLTs } from '@/lib/network-data'
import type { OLT } from '@/lib/network-data'
import { InteractiveDeviceVisual } from '@/components/interactive-device-visual'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity } from 'lucide-react'

interface PhysicalDeviceGUIProps {
  olt: OLT | undefined
}

export function PhysicalDeviceGUI({ olt }: PhysicalDeviceGUIProps) {
  const device = olt || sampleOLTs[0]

  if (!device) return null

  return (
    <div className="space-y-6">
      {/* Device Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Physical Device - Optical Line Terminal</h1>
            <p className="text-sm text-muted-foreground mt-2">ME={device.id}</p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>

        {/* Device Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Device Name</p>
            <p className="font-semibold text-foreground">{device.deviceName}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Model</p>
            <p className="font-semibold text-foreground">{device.model}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Serial Number</p>
            <p className="font-mono text-sm text-foreground">{device.serialNumber}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Total Racks</p>
            <p className="font-semibold text-foreground">{device.racks.length}</p>
          </Card>
        </div>
      </div>

      {/* Interactive Device Explorer */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Device Explorer</h2>
        <Card className="p-6">
          <InteractiveDeviceVisual olt={device} />
        </Card>
      </div>
    </div>
  )
}
