import * as React from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Receipt,
  Plus,
  Search,
  User as UserIcon,
  Printer,
  X,
  FileText,
  DollarSign,
  TrendingUp,
} from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { type Sale, type Product, type PaginatedResponse } from "@/lib/types"
import { formatINR, formatDateTime, formatNumber } from "@/lib/formatters"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/ui/ErrorState"
import { PageHeader } from "@/components/ui/PageHeader"
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/Dialog"
import { fadeInItem, staggerContainer } from "@/lib/motion"

export function SaleListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchTerm, setSearchTerm] = React.useState(searchParams.get("q") || "")
  const [selectedProduct, setSelectedProduct] = React.useState(searchParams.get("product") || "")
  const [startDate, setStartDate] = React.useState(searchParams.get("start_date") || "")
  const [endDate, setEndDate] = React.useState(searchParams.get("end_date") || "")

  // Active receipt modal state
  const [receiptSale, setReceiptSale] = React.useState<Sale | null>(null)

  // Fetch product list for the filter dropdown
  const { data: productResponse } = useQuery<PaginatedResponse<Product> | Product[]>({
    queryKey: ["products-all"],
    queryFn: () => apiClient.get<PaginatedResponse<Product> | Product[]>("/products/?ordering=name"),
  })
  const products: Product[] = Array.isArray(productResponse)
    ? productResponse
    : productResponse?.results || []

  // Fetch sales
  const salesUrl = `/sales/?q=${encodeURIComponent(searchTerm)}&product=${selectedProduct}&start_date=${startDate}&end_date=${endDate}`
  const {
    data: salesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<PaginatedResponse<Sale> | Sale[]>({
    queryKey: ["sales", searchTerm, selectedProduct, startDate, endDate],
    queryFn: () => apiClient.get<PaginatedResponse<Sale> | Sale[]>(salesUrl),
  })

  const sales: Sale[] = Array.isArray(salesResponse)
    ? salesResponse
    : salesResponse?.results || []

  // Metrics
  const totalSalesCount = sales.length
  const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.total_price || 0), 0)
  const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0

  const handleResetFilters = () => {
    setSearchTerm("")
    setSelectedProduct("")
    setStartDate("")
    setEndDate("")
    setSearchParams({})
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Page Header */}
      <PageHeader
        title="Sales History"
        description="Complete transaction ledger with real-time stock deduction audit trails."
        icon={<Receipt className="h-6 w-6 text-primary" />}
        actions={
          <Link to="/sales/new">
            <Button className="shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" />
              Record Sale
            </Button>
          </Link>
        }
      />

      {/* KPI Summary Cards */}
      <motion.div variants={fadeInItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">Recorded Transactions</p>
            <p className="text-xl font-bold text-charcoal mt-1">{formatNumber(totalSalesCount)}</p>
          </div>
          <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center text-primary">
            <FileText className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">Filtered Revenue</p>
            <p className="text-xl font-bold text-primary mt-1">{formatINR(totalRevenue)}</p>
          </div>
          <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">Avg Transaction Value</p>
            <p className="text-xl font-bold text-charcoal mt-1">{formatINR(averageTicket)}</p>
          </div>
          <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center text-primary">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
      </motion.div>

      {/* Search and Filters Bar */}
      <motion.div variants={fadeInItem} className="bg-surface border border-border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
            <Input
              placeholder="Search product or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Product Filter */}
          <div>
            <Select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </Select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start date"
              title="Filter by start date"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End date"
              title="Filter by end date"
              className="flex-1"
            />
            {(searchTerm || selectedProduct || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="shrink-0 text-charcoal-muted hover:text-charcoal px-2"
                title="Reset filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Sales Table */}
      <motion.div variants={fadeInItem} className="bg-surface border border-border rounded-lg overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState
              title="Failed to load sales"
              message="An error occurred while loading transaction records."
              onRetry={() => refetch()}
            />
          </div>
        ) : sales.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={
                searchTerm || selectedProduct || startDate || endDate
                  ? "No matching sales"
                  : "No sales recorded yet"
              }
              description={
                searchTerm || selectedProduct || startDate || endDate
                  ? "Try resetting your search query or date filters."
                  : "Record your first transaction to initiate sales tracking and automatic inventory deduction."
              }
              action={
                searchTerm || selectedProduct || startDate || endDate ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Link to="/sales/new">
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Record Sale
                    </Button>
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[14%]">Transaction ID</TableHead>
                <TableHead className="w-[20%]">Date & Time</TableHead>
                <TableHead className="w-[26%]">Product</TableHead>
                <TableHead className="w-[10%] text-right">Qty</TableHead>
                <TableHead className="w-[12%] text-right">Unit Price</TableHead>
                <TableHead className="w-[14%] text-right">Total Price</TableHead>
                <TableHead className="w-[14%]">Sold By</TableHead>
                <TableHead className="w-[6%] text-center">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} className="h-11 hover:bg-[#FAFBF9]">
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-charcoal">
                      #TX-{String(sale.id).padStart(5, "0")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-charcoal-muted">
                      {formatDateTime(sale.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-xs text-charcoal">{sale.product.name}</p>
                      <p className="font-mono text-[10px] text-charcoal-muted">{sale.product.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-xs text-charcoal">
                      {formatNumber(sale.quantity)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-charcoal-muted">
                      {formatINR(sale.unit_price)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-xs text-primary">
                      {formatINR(sale.total_price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-charcoal">
                      <UserIcon className="h-3 w-3 text-charcoal-muted" />
                      <span>{sale.sold_by?.full_name || sale.sold_by?.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReceiptSale(sale)}
                      title="View Receipt"
                      className="h-8 w-8 p-0"
                    >
                      <Receipt className="h-4 w-4 text-primary" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Receipt Modal */}
      <Dialog
        open={!!receiptSale}
        onOpenChange={(open) => {
          if (!open) setReceiptSale(null)
        }}
      >
        <DialogContent className="max-w-md">
          {receiptSale && (
            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="text-center border-b border-border pb-4">
                <div className="flex justify-center mb-1">
                  <img src="/invlab-logo.png" alt="InvLab" className="h-7 w-auto object-contain" />
                </div>
                <p className="text-[11px] text-charcoal-muted uppercase tracking-wider">Official Sales Receipt</p>
                <div className="mt-2 text-xs font-mono font-semibold text-charcoal">
                  #TX-{String(receiptSale.id).padStart(6, "0")}
                </div>
                <p className="text-[11px] text-charcoal-muted mt-0.5">
                  {formatDateTime(receiptSale.created_at)}
                </p>
              </div>

              {/* Receipt Meta */}
              <div className="text-xs space-y-1.5 bg-[#FAFBF9] p-3 rounded-md border border-border">
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Cashier / Staff:</span>
                  <span className="font-semibold text-charcoal">
                    {receiptSale.sold_by?.full_name || receiptSale.sold_by?.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Payment Status:</span>
                  <Badge variant="success" className="text-[10px] py-0">Completed</Badge>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-border rounded-md overflow-hidden">
                <div className="bg-[#F2F4F0] px-3 py-1.5 text-[11px] font-semibold text-charcoal uppercase grid grid-cols-12">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Price</span>
                </div>
                <div className="p-3 text-xs grid grid-cols-12 items-center">
                  <div className="col-span-6">
                    <p className="font-semibold text-charcoal">{receiptSale.product.name}</p>
                    <p className="font-mono text-[10px] text-charcoal-muted">{receiptSale.product.sku}</p>
                  </div>
                  <div className="col-span-2 text-center font-medium text-charcoal">
                    {receiptSale.quantity}
                  </div>
                  <div className="col-span-4 text-right">
                    <p className="font-medium text-charcoal">{formatINR(receiptSale.unit_price)} ea</p>
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="border-t border-border pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-charcoal-muted">
                  <span>Subtotal:</span>
                  <span>{formatINR(receiptSale.total_price)}</span>
                </div>
                <div className="flex justify-between text-charcoal-muted">
                  <span>Tax (included):</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-primary pt-2 border-t border-dashed border-border">
                  <span>Total Amount Paid:</span>
                  <span>{formatINR(receiptSale.total_price)}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <DialogFooter className="flex gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReceiptSale(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={handlePrintReceipt}
                  className="shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print Receipt
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
