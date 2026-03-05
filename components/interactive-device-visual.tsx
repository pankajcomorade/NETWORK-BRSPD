'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Zap, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { OLT, Rack, Shelf, Slot, Card as CardType, Port } from '@/lib/network-data'

interface InteractiveDeviceVisualProps {
  olt: OLT | undefined
}

type ViewLevel = 'container' | 'rack' | 'shelf' | 'slot' | 'card' | 'port'

export function InteractiveDeviceVisual({ olt }: InteractiveDeviceVisualProps) {
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('container')
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null)
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [selectedPort, setSelectedPort] = useState<Port | null>(null)

  if (!olt) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981'
      case 'inactive':
        return '#6b7280'
      case 'alarm':
        return '#f59e0b'
      case 'maintenance':
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  const handleRackClick = (rack: Rack) => {
    setSelectedRack(rack)
    setCurrentLevel('rack')
  }

  const handleShelfClick = (shelf: Shelf) => {
    setSelectedShelf(shelf)
    setCurrentLevel('shelf')
  }

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot)
    setCurrentLevel('slot')
  }

  const handleCardClick = (card: CardType | null) => {
    setSelectedCard(card)
    if (card) {
      setCurrentLevel('card')
    }
  }

  const handlePortClick = (port: Port) => {
    setSelectedPort(port)
    setCurrentLevel('port')
  }

  const handleBack = () => {
    switch (currentLevel) {
      case 'rack':
        setCurrentLevel('container')
        setSelectedRack(null)
        break
      case 'shelf':
        setCurrentLevel('rack')
        setSelectedShelf(null)
        break
      case 'slot':
        setCurrentLevel('shelf')
        setSelectedSlot(null)
        break
      case 'card':
        setCurrentLevel('slot')
        setSelectedCard(null)
        break
      case 'port':
        setCurrentLevel('card')
        setSelectedPort(null)
        break
    }
  }

  // Render Container View (All Racks)
  const renderContainerView = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Click on any rack to drill down into its structure
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {olt.racks.map((rack) => (
          <motion.div
            key={rack.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleRackClick(rack)}
            className="cursor-pointer"
          >
            <Card className="p-4 border-l-4" style={{ borderLeftColor: getStatusColor(rack.operationalStatus) }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{rack.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{rack.description}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline" className="text-[10px]">
                      {rack.shelves.length} Shelves
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {rack.shelves.reduce((total, s) => total + s.slots.length, 0)} Slots
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${getStatusColor(rack.operationalStatus)}20` }}>
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getStatusColor(rack.operationalStatus) }} />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Render Rack View (All Shelves)
  const renderRackView = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {selectedRack?.label} - Click on a shelf to explore
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {selectedRack?.shelves.map((shelf) => (
          <motion.div
            key={shelf.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleShelfClick(shelf)}
            className="cursor-pointer"
          >
            <Card className="p-3 border-l-4" style={{ borderLeftColor: getStatusColor(shelf.operationalStatus) }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-medium text-sm text-foreground">{shelf.label}</h4>
                  <p className="text-xs text-muted-foreground">{shelf.slots.length} slots</p>
                </div>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${getStatusColor(shelf.operationalStatus)}20` }}>
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getStatusColor(shelf.operationalStatus) }} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Render Shelf View (All Slots)
  const renderShelfView = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {selectedRack?.label} / {selectedShelf?.label} - Click on a slot to see installed cards
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {selectedShelf?.slots.map((slot) => (
          <motion.div
            key={slot.id}
            whileHover={{ scale: 1.08 }}
            onClick={() => handleSlotClick(slot)}
            className="cursor-pointer"
          >
            <div
              className="p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 min-h-20 transition-all hover:shadow-lg"
              style={{
                borderColor: getStatusColor(slot.card?.operationalStatus || 'inactive'),
                backgroundColor: `${getStatusColor(slot.card?.operationalStatus || 'inactive')}10`,
              }}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getStatusColor(slot.card?.operationalStatus || 'inactive') }}
              />
              <span className="text-xs font-medium text-center text-foreground">{slot.label}</span>
              {slot.card && (
                <span className="text-[10px] text-muted-foreground text-center truncate w-full px-1">
                  {slot.card.cardModel}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Render Slot View (Single Card)
  const renderSlotView = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {selectedRack?.label} / {selectedShelf?.label} / {selectedSlot?.label}
      </div>
      <Card className="p-6 border-l-4" style={{ borderLeftColor: getStatusColor(selectedSlot?.card?.operationalStatus || 'inactive') }}>
        {selectedSlot?.card ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{selectedSlot.card.cardModel}</h3>
              <p className="text-sm text-muted-foreground mt-1">{selectedSlot.card.description}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Serial</p>
                <p className="font-mono text-sm text-foreground">{selectedSlot.card.serialNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <Badge variant="outline" className="mt-1">{selectedSlot.card.operationalStatus}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Ports</p>
                <p className="font-semibold text-sm text-foreground">{selectedSlot.card.ports.length}</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Click on a port to view details
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No card installed in this slot</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => handleCardClick(null)}>
              View Installed Cards
            </Button>
          </div>
        )}
      </Card>
      {selectedSlot?.card && (
        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Ports</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {selectedSlot.card.ports.map((port) => (
              <motion.div
                key={port.id}
                whileHover={{ scale: 1.1 }}
                onClick={() => handlePortClick(port)}
                className="cursor-pointer"
              >
                <div
                  className="p-2 rounded-lg border flex flex-col items-center justify-center gap-1 text-center transition-all hover:shadow-md"
                  style={{
                    borderColor: getStatusColor(port.operationalStatus),
                    backgroundColor: `${getStatusColor(port.operationalStatus)}15`,
                  }}
                >
                  <Zap className="h-3 w-3" style={{ color: getStatusColor(port.operationalStatus) }} />
                  <span className="text-[10px] font-medium text-foreground truncate w-full">{port.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Render Card View
  const renderCardView = () => (
    <div className="space-y-4">
      {selectedCard && (
        <>
          <div className="text-sm text-muted-foreground">
            {selectedCard.cardModel} - Ports
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedCard.ports.map((port) => (
              <motion.div
                key={port.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => handlePortClick(port)}
                className="cursor-pointer"
              >
                <Card className="p-4 border-l-4" style={{ borderLeftColor: getStatusColor(port.operationalStatus) }}>
                  <div className="text-center">
                    <Zap className="h-5 w-5 mx-auto mb-2" style={{ color: getStatusColor(port.operationalStatus) }} />
                    <h4 className="font-medium text-foreground">{port.label}</h4>
                    <Badge variant="outline" className="mt-2 text-[10px]">{port.operationalStatus}</Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )

  // Render Port Details View
  const renderPortView = () => (
    <div className="space-y-4">
      {selectedPort && (
        <Card className="p-6 border-l-4" style={{ borderLeftColor: getStatusColor(selectedPort.operationalStatus) }}>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selectedPort.label}</h3>
                <p className="text-sm text-muted-foreground">{selectedPort.portType}</p>
              </div>
              <Badge>{selectedPort.operationalStatus}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Connector Type</p>
                <p className="font-semibold text-foreground">{selectedPort.connectorType}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">TX Power</p>
                <p className="font-mono text-foreground">{selectedPort.txPower}dBm</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">RX Power</p>
                <p className="font-mono text-foreground">{selectedPort.rxPower}dBm</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Wavelength</p>
                <p className="font-mono text-foreground">{selectedPort.wavelength}nm</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Max Speed</p>
                <p className="font-semibold text-foreground">{selectedPort.maxSpeed}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Lane</p>
                <p className="font-semibold text-foreground">{selectedPort.lane}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentLevel !== 'container' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <h2 className="text-lg font-semibold text-foreground capitalize">
            {currentLevel === 'container' ? `${olt.deviceName} - Container View` : `${currentLevel} View`}
          </h2>
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={currentLevel}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {currentLevel === 'container' && renderContainerView()}
        {currentLevel === 'rack' && renderRackView()}
        {currentLevel === 'shelf' && renderShelfView()}
        {currentLevel === 'slot' && renderSlotView()}
        {currentLevel === 'card' && renderCardView()}
        {currentLevel === 'port' && renderPortView()}
      </motion.div>
    </div>
  )
}
