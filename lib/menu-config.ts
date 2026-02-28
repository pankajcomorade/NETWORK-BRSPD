// ==========================================
// Portal Menu Configuration
// ==========================================
// All menus and submenus are defined here as enums/constants.
// Update this file to add/remove/reorder menus.
// ==========================================

import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Server,
  Network,
  MapPin,
  CalendarClock,
  Wrench,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react"

// ==========================================
// Role definitions
// ==========================================
export enum UserRole {
  ADMIN = "admin",
  ENGINEER = "engineer",
  VIEWER = "viewer",
  FIELD_TECH = "field_tech",
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrator",
  [UserRole.ENGINEER]: "Network Engineer",
  [UserRole.VIEWER]: "Viewer",
  [UserRole.FIELD_TECH]: "Field Technician",
}

// ==========================================
// Menu item enum
// ==========================================
export enum MenuId {
  HOME = "home",
  SPECIFICATIONS = "specifications",
  ROLES = "roles",
  RESOURCES = "resources",
  NETWORKS = "networks",
  LOCATIONS = "locations",
  RESERVATIONS = "reservations",
  UTILITIES = "utilities",
  ADMIN = "admin",
}

// ==========================================
// Submenu item enum
// ==========================================
export enum SubMenuId {
  // Home
  HOME_DASHBOARD = "home_dashboard",
  HOME_ALERTS = "home_alerts",
  HOME_ACTIVITY = "home_activity",

  // Specifications
  SPEC_DEVICE = "spec_device",
  SPEC_CABLE = "spec_cable",
  SPEC_PORT = "spec_port",
  SPEC_CONNECTOR = "spec_connector",

  // Roles
  ROLES_MANAGE = "roles_manage",
  ROLES_PERMISSIONS = "roles_permissions",

  // Resources
  RES_PHYSICAL = "res_physical",
  RES_LOGICAL = "res_logical",

  // Networks
  NET_OVERVIEW = "net_overview",
  NET_TOPOLOGY = "net_topology",
  NET_PERFORMANCE = "net_performance",
  NET_OLT_HIERARCHY = "net_olt_hierarchy",

  // Locations
  LOC_SITES = "loc_sites",
  LOC_MAP = "loc_map",
  LOC_ADDRESSES = "loc_addresses",

  // Reservations
  RESV_ACTIVE = "resv_active",
  RESV_PENDING = "resv_pending",
  RESV_HISTORY = "resv_history",

  // Utilities
  UTIL_IMPORT = "util_import",
  UTIL_EXPORT = "util_export",
  UTIL_AUDIT = "util_audit",
  UTIL_REPORTS = "util_reports",

  // Admin
  ADMIN_USERS = "admin_users",
  ADMIN_SETTINGS = "admin_settings",
  ADMIN_LOGS = "admin_logs",
}

// ==========================================
// Menu item type
// ==========================================
export interface MenuItem {
  id: MenuId
  label: string
  icon: LucideIcon
  allowedRoles: UserRole[] // empty = all roles
  subMenus: SubMenuItem[]
}

export interface SubMenuItem {
  id: SubMenuId
  label: string
  allowedRoles: UserRole[] // empty = all roles
}

// ==========================================
// Full menu configuration
// ==========================================
export const MENU_CONFIG: MenuItem[] = [
  {
    id: MenuId.HOME,
    label: "Home",
    icon: LayoutDashboard,
    allowedRoles: [],
    subMenus: [
      { id: SubMenuId.HOME_DASHBOARD, label: "Dashboard", allowedRoles: [] },
      { id: SubMenuId.HOME_ALERTS, label: "Alerts", allowedRoles: [] },
      { id: SubMenuId.HOME_ACTIVITY, label: "Activity Log", allowedRoles: [] },
    ],
  },
  {
    id: MenuId.SPECIFICATIONS,
    label: "Specifications",
    icon: FileText,
    allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER],
    subMenus: [
      { id: SubMenuId.SPEC_DEVICE, label: "Device Specs", allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER] },
      { id: SubMenuId.SPEC_CABLE, label: "Cable Specs", allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER] },
      { id: SubMenuId.SPEC_PORT, label: "Port Specs", allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER] },
      { id: SubMenuId.SPEC_CONNECTOR, label: "Connector Specs", allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER] },
    ],
  },
  {
    id: MenuId.ROLES,
    label: "Roles",
    icon: ShieldCheck,
    allowedRoles: [UserRole.ADMIN],
    subMenus: [
      { id: SubMenuId.ROLES_MANAGE, label: "Manage Roles", allowedRoles: [UserRole.ADMIN] },
      { id: SubMenuId.ROLES_PERMISSIONS, label: "Permissions", allowedRoles: [UserRole.ADMIN] },
    ],
  },
  {
    id: MenuId.RESOURCES,
    label: "Resources",
    icon: Server,
    allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER, UserRole.FIELD_TECH],
    subMenus: [
      { id: SubMenuId.RES_PHYSICAL, label: "Physical", allowedRoles: [] },
      { id: SubMenuId.RES_LOGICAL, label: "Logical", allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER] },
    ],
  },
  {
    id: MenuId.NETWORKS,
    label: "Networks",
    icon: Network,
    allowedRoles: [],
    subMenus: [
      { id: SubMenuId.NET_OVERVIEW, label: "Overview", allowedRoles: [] },
      { id: SubMenuId.NET_TOPOLOGY, label: "Topology", allowedRoles: [] },
      { id: SubMenuId.NET_PERFORMANCE, label: "Performance", allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER] },
      { id: SubMenuId.NET_OLT_HIERARCHY, label: "OLT Hierarchy", allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER] },
    ],
  },
  {
    id: MenuId.LOCATIONS,
    label: "Locations",
    icon: MapPin,
    allowedRoles: [],
    subMenus: [
      { id: SubMenuId.LOC_SITES, label: "Sites", allowedRoles: [] },
      { id: SubMenuId.LOC_MAP, label: "Map View", allowedRoles: [] },
      { id: SubMenuId.LOC_ADDRESSES, label: "Addresses", allowedRoles: [] },
    ],
  },
  {
    id: MenuId.RESERVATIONS,
    label: "Reservations",
    icon: CalendarClock,
    allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER, UserRole.FIELD_TECH],
    subMenus: [
      { id: SubMenuId.RESV_ACTIVE, label: "Active", allowedRoles: [] },
      { id: SubMenuId.RESV_PENDING, label: "Pending", allowedRoles: [] },
      { id: SubMenuId.RESV_HISTORY, label: "History", allowedRoles: [] },
    ],
  },
  {
    id: MenuId.UTILITIES,
    label: "Utilities",
    icon: Wrench,
    allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER],
    subMenus: [
      { id: SubMenuId.UTIL_IMPORT, label: "Import", allowedRoles: [UserRole.ADMIN] },
      { id: SubMenuId.UTIL_EXPORT, label: "Export", allowedRoles: [UserRole.ADMIN, UserRole.ENGINEER] },
      { id: SubMenuId.UTIL_AUDIT, label: "Audit Trail", allowedRoles: [UserRole.ADMIN] },
      { id: SubMenuId.UTIL_REPORTS, label: "Reports", allowedRoles: [] },
    ],
  },
  {
    id: MenuId.ADMIN,
    label: "Admin",
    icon: Settings,
    allowedRoles: [UserRole.ADMIN],
    subMenus: [
      { id: SubMenuId.ADMIN_USERS, label: "Users", allowedRoles: [UserRole.ADMIN] },
      { id: SubMenuId.ADMIN_SETTINGS, label: "Settings", allowedRoles: [UserRole.ADMIN] },
      { id: SubMenuId.ADMIN_LOGS, label: "System Logs", allowedRoles: [UserRole.ADMIN] },
    ],
  },
]

// ==========================================
// Helper: filter menus by role
// ==========================================
export function getMenusForRole(role: UserRole): MenuItem[] {
  return MENU_CONFIG.filter(
    (menu) => menu.allowedRoles.length === 0 || menu.allowedRoles.includes(role)
  ).map((menu) => ({
    ...menu,
    subMenus: menu.subMenus.filter(
      (sub) => sub.allowedRoles.length === 0 || sub.allowedRoles.includes(role)
    ),
  }))
}
