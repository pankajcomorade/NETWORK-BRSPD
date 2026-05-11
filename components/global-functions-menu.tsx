"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  UserCheck,
  Zap,
  Move,
  Replace,
  Unlink,
  GripVertical,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

import { useAuth } from "@/lib/auth-context"
import { UserRole } from "@/lib/menu-config"

const ACTIONS = [
  { id: "assign", label: "Assign", icon: UserCheck, color: "text-blue-500", bgColor: "bg-blue-500/10", roles: [UserRole.ADMIN, UserRole.ENGINEER] },
  { id: "activate", label: "Activate", icon: Zap, color: "text-emerald-500", bgColor: "bg-emerald-500/10", roles: [UserRole.ADMIN, UserRole.ENGINEER, UserRole.FIELD_TECH] },
  { id: "move", label: "Move", icon: Move, color: "text-amber-500", bgColor: "bg-amber-500/10", roles: [UserRole.ADMIN, UserRole.ENGINEER, UserRole.FIELD_TECH] },
  { id: "rip", label: "RIP", icon: Replace, color: "text-purple-500", bgColor: "bg-purple-500/10", roles: [UserRole.ADMIN, UserRole.ENGINEER] },
  { id: "disconnect", label: "Disconnect", icon: Unlink, color: "text-rose-500", bgColor: "bg-rose-500/10", roles: [UserRole.ADMIN, UserRole.ENGINEER, UserRole.FIELD_TECH] },
]

export function GlobalFunctionsMenu() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Filter actions based on user role
  const allowedActions = ACTIONS.filter(action =>
    !user || action.roles.includes(user.role as UserRole)
  )

  // If no actions allowed for this role, don't show the menu at all
  if (allowedActions.length === 0) return null

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    // Start 5s timer to close
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className="fixed right-0 top-1/2 z-[100] -translate-y-1/2 flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="dock"
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mr-2 flex flex-col gap-2 rounded-l-2xl border border-r-0 border-border bg-background/80 p-2 shadow-2xl backdrop-blur-xl"
            >
              {allowedActions.map((action) => {
                const Icon = action.icon
                return (
                  <Tooltip key={action.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-10 w-10 rounded-xl transition-all hover:scale-110",
                          action.bgColor,
                          action.color
                        )}
                        onClick={() => {
                          console.log(`Action: ${action.label}`)
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="font-medium bg-popover/90 backdrop-blur-md border-border/50">
                      {action.label}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </motion.div>
          ) : (
            <motion.button
              key="trigger"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              whileHover={{ x: -5 }}
              className="flex h-24 w-8 items-center justify-center rounded-l-2xl border border-r-0 border-border bg-primary/10 text-primary shadow-lg backdrop-blur-md transition-colors hover:bg-primary hover:text-primary-foreground group"
              onClick={() => setIsOpen(true)}
            >
              <div className="flex flex-col items-center gap-2">
                <GripVertical className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="[writing-mode:vertical-lr] text-[9px] font-bold tracking-[0.2em] uppercase"></span>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
