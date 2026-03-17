"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Trash2,
  LogOut,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// Mock order data
interface OrderRecord {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  address: string
  serviceType: string
  status: "pending" | "active" | "completed" | "cancelled"
  createdDate: string
  lci: string
}

const mockOrders: OrderRecord[] = [
  {
    id: "1",
    orderNumber: "ORD-001234",
    customerId: "CUST-5001",
    customerName: "John Smith",
    address: "123 Main St",
    serviceType: "FTTH",
    status: "active",
    createdDate: "2026-02-20",
    lci: "LCI-001",
  },
  {
    id: "2",
    orderNumber: "ORD-001235",
    customerId: "CUST-5002",
    customerName: "Sarah Johnson",
    address: "456 Oak Ave",
    serviceType: "FTTH",
    status: "pending",
    createdDate: "2026-02-21",
    lci: "LCI-002",
  },
  {
    id: "3",
    orderNumber: "ORD-001236",
    customerId: "CUST-5003",
    customerName: "Michael Brown",
    address: "789 Elm St",
    serviceType: "FTTH",
    status: "active",
    createdDate: "2026-02-19",
    lci: "LCI-003",
  },
  {
    id: "4",
    orderNumber: "ORD-001237",
    customerId: "CUST-5004",
    customerName: "Emily Davis",
    address: "321 Pine Rd",
    serviceType: "FTTH",
    status: "completed",
    createdDate: "2026-02-15",
    lci: "LCI-004",
  },
  {
    id: "5",
    orderNumber: "ORD-001238",
    customerId: "CUST-5005",
    customerName: "David Wilson",
    address: "654 Birch Ln",
    serviceType: "FTTH",
    status: "pending",
    createdDate: "2026-02-22",
    lci: "LCI-005",
  },
  {
    id: "6",
    orderNumber: "ORD-001239",
    customerId: "CUST-5006",
    customerName: "Jennifer Moore",
    address: "987 Cedar Dr",
    serviceType: "FTTH",
    status: "active",
    createdDate: "2026-02-18",
    lci: "LCI-006",
  },
]

type SortField = keyof OrderRecord
type SortOrder = "asc" | "desc"

export function OrderDetails() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderRecord[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>("createdDate")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)

  // Handle search/find
  const handleFind = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Error", description: "Please enter an order number", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      console.log("[v0] Fetching orders for:", searchQuery)
      
      // Use internal API route to avoid CORS issues
      const apiUrl = `/api/orders/search?orderNum=${encodeURIComponent(searchQuery)}`
      console.log("[v0] API URL:", apiUrl)
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      })

      console.log("[v0] API Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error:", response.status, errorText)
        toast({ title: "Error", description: `Failed to fetch orders: ${response.status}`, variant: "destructive" })
        setOrders([])
        setFilteredOrders([])
        return
      }

      const data = await response.json()
      console.log("[v0] API Response data:", data)

      // Handle different response structures
      let fetchedOrders: OrderRecord[] = []
      
      if (Array.isArray(data)) {
        // If response is directly an array
        fetchedOrders = data.map((order: any, index: number) => ({
          id: order.id || order.orderId || String(index),
          orderNumber: order.orderNumber || order.orderNum || "N/A",
          customerId: order.customerId || "N/A",
          customerName: order.customerName || "N/A",
          address: order.address || "N/A",
          serviceType: order.serviceType || "FTTH",
          status: order.status?.toLowerCase() || "pending" as any,
          createdDate: order.createdDate || new Date().toISOString().split('T')[0],
          lci: order.lci || `LCI-${index}`,
        }))
      } else if (data.orders && Array.isArray(data.orders)) {
        // If response has orders array
        fetchedOrders = data.orders.map((order: any, index: number) => ({
          id: order.id || order.orderId || String(index),
          orderNumber: order.orderNumber || order.orderNum || "N/A",
          customerId: order.customerId || "N/A",
          customerName: order.customerName || "N/A",
          address: order.address || "N/A",
          serviceType: order.serviceType || "FTTH",
          status: order.status?.toLowerCase() || "pending" as any,
          createdDate: order.createdDate || new Date().toISOString().split('T')[0],
          lci: order.lci || `LCI-${index}`,
        }))
      } else if (data.data && Array.isArray(data.data)) {
        // If response has data array
        fetchedOrders = data.data.map((order: any, index: number) => ({
          id: order.id || order.orderId || String(index),
          orderNumber: order.orderNumber || order.orderNum || "N/A",
          customerId: order.customerId || "N/A",
          customerName: order.customerName || "N/A",
          address: order.address || "N/A",
          serviceType: order.serviceType || "FTTH",
          status: order.status?.toLowerCase() || "pending" as any,
          createdDate: order.createdDate || new Date().toISOString().split('T')[0],
          lci: order.lci || `LCI-${index}`,
        }))
      }

      if (fetchedOrders.length === 0) {
        toast({ title: "No Results", description: `No orders found for "${searchQuery}"`, variant: "default" })
      } else {
        toast({ title: "Success", description: `Found ${fetchedOrders.length} order(s)` })
      }

      setOrders(fetchedOrders)
      setFilteredOrders(fetchedOrders)
      setCurrentPage(1)
      setSelectedRows(new Set())
    } catch (error) {
      console.error("[v0] Fetch error:", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to fetch orders", variant: "destructive" })
      setOrders([])
      setFilteredOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, toast])

  // Sorting logic
  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return 0
    })

    return sorted
  }, [filteredOrders, sortField, sortOrder])

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / recordsPerPage)
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage
    return sortedOrders.slice(start, start + recordsPerPage)
  }, [sortedOrders, currentPage, recordsPerPage])

  // Handle row selection
  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedOrders.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedOrders.map((o) => o.id)))
    }
  }

  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // Handle open details
  const handleOpenDetails = () => {
    if (selectedRows.size !== 1) {
      toast({ title: "Error", description: "Please select exactly one order", variant: "destructive" })
      return
    }

    const orderId = Array.from(selectedRows)[0]
    const order = filteredOrders.find((o) => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
      setDetailsOpen(true)
    }
  }

  // Get status badge
  const getStatusBadge = (status: OrderRecord["status"]) => {
    const statusConfig = {
      pending: { label: "Pending", color: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
      active: { label: "Active", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
      completed: { label: "Completed", color: "border-sky-500/30 text-sky-400 bg-sky-500/10" },
      cancelled: { label: "Cancelled", color: "border-red-500/30 text-red-400 bg-red-500/10" },
    }

    const config = statusConfig[status]
    return (
      <Badge variant="outline" className={cn("rounded-md text-[10px]", config.color)}>
        {config.label}
      </Badge>
    )
  }

  const isDetailsButtonEnabled = selectedRows.size === 1

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground text-balance">Order Details</h2>
        <p className="text-muted-foreground mt-1">Search and manage service orders</p>
      </div>

      {/* Search Container */}
      <Card className="rounded-lg border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground">Search by Order Number</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter order number (e.g., ORD-001234)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFind()}
              className="flex-1"
            />
            <Button
              onClick={handleFind}
              disabled={isLoading}
              className="gap-2 whitespace-nowrap"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Find
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {filteredOrders.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Found {filteredOrders.length} order(s) · Showing {Math.min(recordsPerPage, paginatedOrders.length)} of {filteredOrders.length}
        </div>
      )}

      {/* Action Buttons (Top Right) */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenDetails}
            disabled={!isDetailsButtonEnabled}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Open Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRows.size === 0}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Sign Off
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRows.size === 0}
            className="gap-2 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
            Cancel Order
          </Button>
        </div>
      )}

      {/* Results Table */}
      {filteredOrders.length > 0 ? (
        <Card className="rounded-lg border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedRows.size === paginatedOrders.length && paginatedOrders.length > 0}
                      indeterminate={selectedRows.size > 0 && selectedRows.size < paginatedOrders.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("orderNumber")}
                  >
                    Order Number {sortField === "orderNumber" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("customerId")}
                  >
                    Customer ID {sortField === "customerId" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("customerName")}
                  >
                    Customer Name {sortField === "customerName" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Address</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Service Type</TableHead>
                  <TableHead
                    className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("status")}
                  >
                    Status {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("createdDate")}
                  >
                    Created {sortField === "createdDate" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-b border-border/20 hover:bg-secondary/20 cursor-pointer"
                    onClick={() => toggleRow(order.id)}
                  >
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.has(order.id)}
                        onCheckedChange={() => toggleRow(order.id)}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-foreground">{order.orderNumber}</TableCell>
                    <TableCell className="px-4 py-3 font-mono text-muted-foreground">{order.customerId}</TableCell>
                    <TableCell className="px-4 py-3 text-foreground">{order.customerName}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground max-w-xs truncate">{order.address}</TableCell>
                    <TableCell className="px-4 py-3 text-foreground">{order.serviceType}</TableCell>
                    <TableCell className="px-4 py-3">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground text-xs font-mono">{order.createdDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-border/50 p-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} />
                    </PaginationItem>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (
                      (page === currentPage - 2 && currentPage > 2) ||
                      (page === currentPage + 2 && currentPage < totalPages - 1)
                    ) {
                      return <PaginationEllipsis key={page} />
                    }
                    return null
                  })}

                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      ) : searchQuery && !isLoading ? (
        <Card className="rounded-lg border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No Orders Found</h3>
            <p className="text-sm text-muted-foreground mt-2">Try searching with a different order number</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Action Buttons (Bottom Right) */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenDetails}
            disabled={!isDetailsButtonEnabled}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Open Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRows.size === 0}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Sign Off
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRows.size === 0}
            className="gap-2 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
            Cancel Order
          </Button>
        </div>
      )}

      {/* Side Dock - Order Details */}
      <AnimatePresence>
        {detailsOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-start justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailsOpen(false)}
              className="absolute inset-0 bg-black/50"
            />

            {/* Dock Panel */}
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative w-full sm:max-w-md md:max-w-lg bg-card border-l border-border/50 h-full overflow-y-auto shadow-2xl"
            >
              {/* Dock Header */}
              <div className="sticky top-0 border-b border-border/50 bg-card p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Order Details</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDetailsOpen(false)}
                  className="p-1 hover:bg-secondary rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Dock Content */}
              <div className="p-6 space-y-6">
                {/* Order Header */}
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-foreground font-mono">{selectedOrder.orderNumber}</h4>
                  <p className="text-sm text-muted-foreground">Order ID: {selectedOrder.id}</p>
                </div>

                {/* Details Grid */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Customer ID</p>
                      <p className="text-sm font-mono text-foreground">{selectedOrder.customerId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">LCI</p>
                      <p className="text-sm font-mono text-foreground">{selectedOrder.lci}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Customer Name</p>
                    <p className="text-sm text-foreground">{selectedOrder.customerName}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Address</p>
                    <p className="text-sm text-foreground">{selectedOrder.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Service Type</p>
                      <p className="text-sm text-foreground">{selectedOrder.serviceType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Status</p>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Created Date</p>
                    <p className="text-sm font-mono text-foreground">{selectedOrder.createdDate}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border/30" />

                {/* Actions */}
                <div className="space-y-3">
                  <Button variant="default" className="w-full gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Sign Off
                  </Button>
                  <Button variant="outline" className="w-full gap-2 text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                    Cancel Order
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
