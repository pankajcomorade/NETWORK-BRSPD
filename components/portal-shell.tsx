"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  Bell,
  Menu,
  LogOut,
  Activity,
  User,
  PanelLeftClose,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  type MenuId,
  type SubMenuId,
  type MenuItem,
  getMenusForRole,
  MENU_CONFIG,
} from "@/lib/menu-config"
import { ThemeToggle } from "@/components/theme-toggle"

// ==========================================
// Content components (placeholder + network)
// ==========================================
import { NetworkContent } from "@/components/network-content"
import { PagePlaceholder } from "@/components/page-placeholder"

// ==========================================
// Portal Shell
// ==========================================
export function PortalShell() {
  const { user, logout, getRoleLabel } = useAuth()
  const [activeMenu, setActiveMenu] = useState<MenuId>("home" as MenuId)
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuId>("home_dashboard" as SubMenuId)

  // Auto-hide sidebar state
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Role-based menu filtering
  const filteredMenus = user ? getMenusForRole(user.role) : []

  // Auto-hide: show on hover near left edge
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (sidebarPinned) return
      if (e.clientX <= 8) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
          hideTimeoutRef.current = null
        }
        setSidebarVisible(true)
      }
    },
    [sidebarPinned]
  )

  // Auto-hide: hide when mouse leaves sidebar
  const handleSidebarLeave = useCallback(() => {
    if (sidebarPinned) return
    hideTimeoutRef.current = setTimeout(() => {
      setSidebarVisible(false)
    }, 300)
  }, [sidebarPinned])

  const handleSidebarEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [handleMouseMove])

  // Navigate to menu + default submenu
  const navigateToMenu = (menuId: MenuId) => {
    setActiveMenu(menuId)
    const menu = filteredMenus.find((m) => m.id === menuId)
    if (menu && menu.subMenus.length > 0) {
      setActiveSubMenu(menu.subMenus[0].id)
    }
    // Auto-close sidebar if not pinned
    if (!sidebarPinned) setSidebarVisible(false)
    setMobileMenuOpen(false)
  }

  // Get current menu config
  const currentMenu = filteredMenus.find((m) => m.id === activeMenu) || filteredMenus[0]

  // ==========================================
  // Sidebar rendering
  // ==========================================
  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">FiberNet</h2>
            <p className="text-[10px] text-muted-foreground">v2.0</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => {
                  setSidebarPinned(!sidebarPinned)
                  if (sidebarPinned) setSidebarVisible(false)
                  else setSidebarVisible(true)
                }}
              >
                <PanelLeftClose
                  className={cn("h-4 w-4 transition-transform", sidebarPinned && "rotate-180")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {sidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Menu items */}
      <ScrollArea className="flex-1 py-3 px-2">
        <div className="space-y-1">
          {filteredMenus.map((menu) => {
            const Icon = menu.icon
            const isActive = activeMenu === menu.id
            return (
              <button
                key={menu.id}
                onClick={() => navigateToMenu(menu.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="truncate">{menu.label}</span>
                {isActive && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* User footer */}
      <div className="border-t border-border/50 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{getRoleLabel()}</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg shrink-0" onClick={logout}>
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )

  // ==========================================
  // Render content based on activeMenu + activeSubMenu
  // ==========================================
  const renderContent = () => {
    if (activeMenu === ("networks" as MenuId)) {
      return <NetworkContent subMenu={activeSubMenu} />
    }
    return (
      <PagePlaceholder
        menuId={activeMenu}
        subMenuId={activeSubMenu}
        menuLabel={currentMenu?.label || ""}
        subMenuLabel={
          currentMenu?.subMenus.find((s) => s.id === activeSubMenu)?.label || ""
        }
      />
    )
  }

  // ==========================================
  // Main render
  // ==========================================
  return (
    <div className="relative min-h-screen bg-background">
      {/* ---- Mobile overlay ---- */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ---- Sidebar: Desktop auto-hide ---- */}
      <div
        ref={triggerRef}
        className="fixed inset-y-0 left-0 z-30 hidden w-1 md:block"
        aria-hidden="true"
      />
      <AnimatePresence>
        {(sidebarVisible || sidebarPinned) && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-30 hidden w-[268px] border-r border-border bg-background md:block"
            onMouseEnter={handleSidebarEnter}
            onMouseLeave={handleSidebarLeave}
          >
            {renderSidebarContent()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Sidebar: Mobile slide-out ---- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-[268px] border-r border-border bg-background md:hidden"
          >
            {renderSidebarContent()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Main content area ---- */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarPinned ? "md:pl-[268px]" : "md:pl-0"
        )}
      >
        {/* ---- Top bar with submenu ---- */}
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          {/* Primary bar */}
          <div className="flex h-12 items-center gap-3 px-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Show menu trigger for desktop when not pinned */}
            {!sidebarPinned && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-8 w-8 rounded-lg"
                onClick={() => setSidebarPinned(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}

            {/* Current section title */}
            <div className="flex items-center gap-2">
              {currentMenu && (
                <>
                  <currentMenu.icon className="h-4 w-4 text-primary" />
                  <h1 className="text-sm font-semibold text-foreground">
                    {currentMenu.label}
                  </h1>
                </>
              )}
            </div>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              {user?.provider === "microsoft_sso" && (
                <Badge variant="outline" className="rounded-md text-[10px] border-sky-500/30 text-sky-400 bg-sky-500/10">
                  SSO
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg relative">
                      <Bell className="h-4 w-4" />
                      <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] text-destructive-foreground">
                        3
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="hidden md:flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {user?.name}
                </span>
              </div>
            </div>
          </div>

          {/* ---- Submenu bar ---- */}
          {currentMenu && currentMenu.subMenus.length > 0 && (
            <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
              {currentMenu.subMenus.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubMenu(sub.id)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    activeSubMenu === sub.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* ---- Page content ---- */}
        <main className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeMenu}-${activeSubMenu}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
