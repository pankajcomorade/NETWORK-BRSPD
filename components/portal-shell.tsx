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
  PanelLeft,
  CircleChevronRight,
  CircleChevronLeft,
  ChevronLeft,
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
import { GlobalFunctionsMenu } from "@/components/global-functions-menu"

// ==========================================
// Portal Shell
// ==========================================
export function PortalShell() {
  const { user, logout, getRoleLabel } = useAuth()
  const [activeMenu, setActiveMenu] = useState<MenuId>("home" as MenuId)
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuId>("home_dashboard" as SubMenuId)

  // Sidebar state
  const [isExpanded, setIsExpanded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Role-based menu filtering
  const filteredMenus = user ? getMenusForRole(user.role) : []

  // No auto-hide logic needed for the new slim sidebar
  useEffect(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
  }, [])

  // Navigate to menu + default submenu
  const navigateToMenu = (menuId: MenuId) => {
    setActiveMenu(menuId)
    const menu = filteredMenus.find((m) => m.id === menuId)
    if (menu && menu.subMenus.length > 0) {
      setActiveSubMenu(menu.subMenus[0].id)
    }
    setMobileMenuOpen(false)
  }

  // Get current menu config
  const currentMenu = filteredMenus.find((m) => m.id === activeMenu) || filteredMenus[0]

  // ==========================================
  // Sidebar rendering
  // ==========================================
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-border/50 transition-all duration-300 relative",
        !isExpanded && !isMobile ? "justify-center p-3" : "justify-between p-4"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 shrink-0">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          {(isExpanded || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-sm font-semibold text-foreground">FiberNet</h2>
              <p className="text-[10px] text-muted-foreground">v2.0</p>
            </motion.div>
          )}
        </div>
        {/* Toggle Button for Desktop */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute h-5 w-5  text-muted-foreground hover:text-foreground z-50 bg-background border border-border shadow-sm",
              isExpanded ? "-right-2 top-14" : "-right-2 top-12"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Menu items */}
      <ScrollArea className="flex-1 py-3 px-2">
        <div className="space-y-1">
          {filteredMenus.map((menu) => {
            const Icon = menu.icon
            const isActive = activeMenu === menu.id
            return (
              <Tooltip key={menu.id} open={isExpanded || isMobile ? false : undefined}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigateToMenu(menu.id)}
                    className={cn(
                      "flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      !isExpanded && !isMobile ? "justify-center px-0" : "gap-3",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {(isExpanded || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="truncate"
                      >
                        {menu.label}
                      </motion.span>
                    )}
                    {(isExpanded || isMobile) && isActive && (
                      <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {menu.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </ScrollArea>

      {/* User footer */}
      <div className="border-t border-border/50 p-3">
        <div className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2",
          !isExpanded && !isMobile && "justify-center px-0"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          {(isExpanded || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{getRoleLabel()}</p>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg shrink-0" onClick={logout}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
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
    <TooltipProvider delayDuration={0}>
      <div className="relative min-h-screen bg-background">
        {/* ---- Mobile overlay ---- */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ---- Sidebar: Desktop slim/expanded ---- */}
        <motion.div
          ref={sidebarRef}
          initial={false}
          animate={{ width: isExpanded ? 268 : 64 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-background md:block overflow-visible"
        >
          {renderSidebarContent()}
        </motion.div>

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
              {renderSidebarContent(true)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Main content area ---- */}
        <div
          className={cn(
            "min-h-screen transition-all duration-300",
            isExpanded ? "md:pl-[268px]" : "md:pl-[64px]"
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
          </header>

          {/* ---- Submenu bar ---- */}
          {currentMenu && currentMenu.subMenus.length > 0 && (
            <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto border-b border-border/50 bg-background/50">
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

          {/* Main Content */}
          <main className="flex-1 p-1 md:p-1.5 overflow-y-auto overflow-x-hidden">
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
        <GlobalFunctionsMenu />
      </div>
    </TooltipProvider>
  )
}
