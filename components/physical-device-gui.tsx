'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Box, Grid3X3, Layers, Zap, Cpu } from 'lucide-react'
import type { OLT, Rack, Shelf, Slot, NetworkCard, Port } from '@/lib/network-data'
import { Card } from '@/components/ui/card'

interface PhysicalDeviceGUIProps {
  olt: OLT
}

type NavigationLevel = 'container' | 'rack' | 'shelf' | 'slot' | 'card' | 'port'

interface NavigationState {
  level: NavigationLevel
  rackId?: string
  shelfId?: string
  slotId?: string
  cardId?: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/80 border-emerald-400'
    case 'inactive':
      return 'bg-slate-700/60 border-slate-600'
    case 'warning':
      return 'bg-amber-500/70 border-amber-400'
    case 'maintenance':
      return 'bg-sky-500/70 border-sky-400'
    default:
      return 'bg-slate-700/60 border-slate-600'
  }
}

const getStatusDot = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-400'
    case 'inactive':
      return 'bg-slate-500'
    case 'warning':
      return 'bg-amber-400'
    case 'maintenance':
      return 'bg-sky-400'
    default:
      return 'bg-slate-500'
  }
}

export function PhysicalDeviceGUI({ olt }: PhysicalDeviceGUIProps) {
  const [navigation, setNavigation] = useState<NavigationState>({
    level: 'container',
  })

  const currentRack =
    olt.racks.find((r) => r.id === navigation.rackId) || olt.racks[0]
  const currentShelf =
    currentRack?.shelves.find((s) => s.id === navigation.shelfId) ||
    currentRack?.shelves[0]
  const currentSlot =
    currentShelf?.slots.find((s) => s.id === navigation.slotId) ||
    currentShelf?.slots[0]
  const currentCard = currentSlot?.card

  const goBack = () => {
    setNavigation((prev) => {
      if (prev.level === 'port') {
        return { ...prev, level: 'card' }
      } else if (prev.level === 'card') {
        return { ...prev, level: 'slot', cardId: undefined }
      } else if (prev.level === 'slot') {
        return { ...prev, level: 'shelf', slotId: undefined }
      } else if (prev.level === 'shelf') {
        return { ...prev, level: 'rack', shelfId: undefined }
      } else if (prev.level === 'rack') {
        return { level: 'container', rackId: undefined }
      }
      return prev
    })
  }

  const selectRack = (rackId: string) => {
    setNavigation({ level: 'rack', rackId })
  }

  const selectShelf = (shelfId: string) => {
    setNavigation((prev) => ({ ...prev, level: 'shelf', shelfId }))
  }

  const selectSlot = (slotId: string) => {
    setNavigation((prev) => ({ ...prev, level: 'slot', slotId }))
  }

  const selectCard = (cardId: string) => {
    setNavigation((prev) => ({ ...prev, level: 'card', cardId }))
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {navigation.level !== 'container' && (
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sky-400 hover:text-sky-300"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="capitalize font-medium">{navigation.level}</span>
            {navigation.rackId && <span>→ {currentRack?.name}</span>}
            {navigation.shelfId && <span>→ {currentShelf?.name}</span>}
            {navigation.slotId && <span>→ {currentSlot?.name}</span>}
            {navigation.cardId && <span>→ {currentCard?.name}</span>}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {/* CONTAINER VIEW - Show all racks */}
          {navigation.level === 'container' && (
            <motion.div
              key="container"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                {olt.racks.map((rack) => {
                  const activeSlots = rack.shelves.reduce(
                    (acc, s) =>
                      acc +
                      s.slots.filter((sl) => sl.status === 'active').length,
                    0
                  )
                  const totalSlots = rack.shelves.reduce(
                    (acc, s) => acc + s.slots.length,
                    0
                  )

                  return (
                    <motion.button
                      key={rack.id}
                      onClick={() => selectRack(rack.id)}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:scale-102 ${getStatusColor(rack.status)}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Box className="w-5 h-5" />
                          <div className="text-left">
                            <div className="font-semibold text-white">
                              {rack.name}
                            </div>
                            <div className="text-sm text-slate-300">
                              {activeSlots}/{totalSlots} Active Slots
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">
                            {rack.shelves.length}
                          </div>
                          <div className="text-xs text-slate-400">Shelves</div>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* RACK VIEW - Show all shelves */}
          {navigation.level === 'rack' && currentRack && (
            <motion.div
              key="rack"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {currentRack.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {currentRack.shelves.length} shelves available
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full ${getStatusDot(currentRack.status)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {currentRack.shelves.map((shelf) => {
                  const activeSlots = shelf.slots.filter(
                    (s) => s.status === 'active'
                  ).length

                  return (
                    <motion.button
                      key={shelf.id}
                      onClick={() => selectShelf(shelf.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${getStatusColor(shelf.status)}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Layers className="w-5 h-5" />
                        <div className="text-center">
                          <div className="text-sm font-semibold text-white">
                            {shelf.name}
                          </div>
                          <div className="text-xs text-slate-300">
                            {activeSlots}/{shelf.slots.length}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* SHELF VIEW - Show all slots */}
          {navigation.level === 'shelf' && currentShelf && (
            <motion.div
              key="shelf"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {currentRack?.name} → {currentShelf.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {currentShelf.slots.length} slots in this shelf
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full ${getStatusDot(currentShelf.status)}`}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                {currentShelf.slots.map((slot) => (
                  <motion.button
                    key={slot.id}
                    onClick={() => selectSlot(slot.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${getStatusColor(slot.status)}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Grid3X3 className="w-4 h-4" />
                        <div>
                          <div className="font-semibold text-white">
                            {slot.name}
                          </div>
                          <div className="text-xs text-slate-300">
                            {slot.card ? `Card: ${slot.card.name}` : 'Empty'}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusDot(slot.status)}`}
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* SLOT VIEW - Show card details */}
          {navigation.level === 'slot' && currentSlot && (
            <motion.div
              key="slot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {currentShelf?.name} → {currentSlot.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {currentSlot.card
                        ? `Contains: ${currentSlot.card.name}`
                        : 'This slot is empty'}
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full ${getStatusDot(currentSlot.status)}`}
                  />
                </div>
              </div>

              {currentSlot.card ? (
                <motion.button
                  onClick={() => selectCard(currentSlot.card!.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${getStatusColor(currentSlot.card.status)}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-6 h-6" />
                      <div>
                        <div className="font-semibold text-white">
                          {currentSlot.card.name}
                        </div>
                        <div className="text-sm text-slate-300">
                          Type: {currentSlot.card.type}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {currentSlot.card.ports.length} Ports
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {currentSlot.card.ports.filter((p) => p.status === 'active').length}
                      </div>
                      <div className="text-xs text-slate-400">Active</div>
                    </div>
                  </div>
                </motion.button>
              ) : (
                <div className="p-4 rounded-lg bg-slate-800/30 border border-dashed border-slate-600 text-center text-slate-400">
                  No card installed in this slot
                </div>
              )}
            </motion.div>
          )}

          {/* CARD VIEW - Show all ports */}
          {navigation.level === 'card' && currentCard && (
            <motion.div
              key="card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {currentCard.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Type: {currentCard.type}
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full ${getStatusDot(currentCard.status)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {currentCard.ports.map((port) => (
                  <motion.button
                    key={port.id}
                    onClick={() =>
                      setNavigation((prev) => ({ ...prev, level: 'port' }))
                    }
                    className={`p-3 rounded-lg border-2 transition-all ${getStatusColor(port.status)}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <div className="text-center">
                        <div className="text-sm font-semibold text-white">
                          {port.name}
                        </div>
                        <div className="text-xs text-slate-300">
                          {port.type}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PORT VIEW - Show port details */}
          {navigation.level === 'port' && currentCard && (
            <motion.div
              key="port"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <h3 className="font-semibold text-white">
                  {currentCard.name} - Port Details
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentCard.ports.map((port) => (
                  <div
                    key={port.id}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(port.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusDot(port.status)}`} />
                        <div>
                          <div className="font-semibold text-white">
                            {port.name}
                          </div>
                          <div className="text-sm text-slate-300">
                            Type: {port.type}
                          </div>
                          {port.connectedTo && (
                            <div className="text-xs text-slate-400 mt-1">
                              Connected to: {port.connectedTo}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white capitalize">
                          {port.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
