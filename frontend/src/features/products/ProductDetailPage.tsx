import * as React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Trash2,
  Receipt,
  SlidersHorizontal,
  AlertTriangle,
  Layers,
  IndianRupee,
} from "lucide-react"
import { toast } from "sonner"

import { apiClient, ApiClientError } from "@/lib/api-client"
import { type Product } from "@/lib/types"
import { formatDateTime } from "@/lib/formatters"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { StatCard } from "@/components/ui/StatCard"
import { Skeleton } from "@/components/ui/Skeleton"
import { ErrorState } from "@/components/ui/ErrorState"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { PageHeader } from "@/components/ui/PageHeader"
import { ActionGuard } from "@/lib/permissions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Input } from "@/components/ui/Input"
import { fadeInItem, staggerContainer } from "@/lib/motion"

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false)
  const [adjustmentAmount, setAdjustmentAmount] = React.useState(0)
  const [adjustmentReason, setAdjustmentReason] = React.useState("")
  const [adjustError, setAdjustError] = React.useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

  const { data: product, isLoading, error, refetch } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => apiClient.get<Product>(`/products/${id}/`),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/products/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success("Product deleted successfully.")
      navigate("/products")
    },
    onError: (err: any) => {
      const msg = err instanceof ApiClientError ? err.getFirstError() : "Failed to delete product."
      toast.error(msg)
      setIsDeleteOpen(false)
    },
  })

  const adjustStockMutation = useMutation({
    mutationFn: () =>
      apiClient.post<Product>(`/products/${id}/adjust-stock/`, {
        adjustment: adjustmentAmount,
        reason: adjustmentReason,
      }),
    onSuccess: (updatedProd) => {
      queryClient.invalidateQueries({ queryKey: ["product", id] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success(`Stock adjusted. New count: ${updatedProd.stock_quantity}`)
      setIsAdjustOpen(false)
      setAdjustmentAmount(0)
      setAdjustmentReason("")
    },
    onError: (err: any) => {
      const msg = err instanceof ApiClientError ? err.getFirstError() : "Failed to adjust stock."
      setAdjustError(msg)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 text-left">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <ErrorState
        title="Product Not Found"
        message={error instanceof Error ? error.message : "Unable to load product details."}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6 text-left">
      {/* Back button */}
      <motion.div variants={fadeInItem}>
        <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-muted hover:text-primary transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
        </Link>
      </motion.div>

      {/* Product Hero Header */}
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku} · Category: ${product.category?.name || "Uncategorized"}`}
        badge={
          product.stock_quantity === 0 ? (
            <Badge variant="destructive">Out of Stock</Badge>
          ) : product.is_low_stock ? (
            <Badge variant="warning">Low Stock</Badge>
          ) : (
            <Badge variant="success">Healthy</Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <ActionGuard role={["Admin", "Manager"]} tooltipMessage="Only Managers and Admins can adjust stock.">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdjustOpen(true)
                  setAdjustmentAmount(0)
                  setAdjustmentReason("")
                  setAdjustError(null)
                }}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                Adjust Stock
              </Button>
            </ActionGuard>

            <Link to={`/sales/new?product=${product.id}`}>
              <Button size="sm">
                <Receipt className="h-3.5 w-3.5 mr-1" />
                Record Sale
              </Button>
            </Link>

            <ActionGuard role={["Admin", "Manager"]} tooltipMessage="Only Managers and Admins can delete products.">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                title="Delete product"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </ActionGuard>
          </div>
        }
      />

      {/* KPI Cards */}
      <motion.div variants={fadeInItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Current Stock"
          value={product.stock_quantity}
          icon={<Layers className="h-4 w-4" />}
          variant={product.stock_quantity === 0 ? "warning" : "primary"}
          subtitle={`Threshold: ${product.low_stock_threshold} units`}
        />
        <StatCard
          title="Unit Selling Price"
          value={product.price}
          isCurrency
          icon={<IndianRupee className="h-4 w-4" />}
          variant="sage"
          subtitle="Fixed catalog price"
        />
        <StatCard
          title="Stock Threshold"
          value={product.low_stock_threshold}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="terracotta"
          subtitle="Alert triggers at or below"
        />
      </motion.div>

      {/* Description & Metadata Card */}
      <motion.div variants={fadeInItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Specifications & Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-charcoal leading-relaxed whitespace-pre-wrap">
              {product.description || "No detailed description has been added for this product."}
            </p>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
              <div>
                <span className="text-charcoal-muted block text-[11px]">Date Created</span>
                <span className="font-medium text-charcoal">{formatDateTime(product.created_at)}</span>
              </div>
              <div>
                <span className="text-charcoal-muted block text-[11px]">Last Updated</span>
                <span className="font-medium text-charcoal">{formatDateTime(product.updated_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Inventory Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/70">
              <span className="text-charcoal-muted">SKU:</span>
              <span className="font-semibold text-charcoal tabular-nums">{product.sku}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/70">
              <span className="text-charcoal-muted">Category:</span>
              <span className="font-semibold text-charcoal">{product.category?.name || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/70">
              <span className="text-charcoal-muted">Units In Stock:</span>
              <span className="font-bold text-primary tabular-nums">{product.stock_quantity}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-charcoal-muted">Status:</span>
              <span>
                {product.stock_quantity === 0 ? (
                  <Badge variant="destructive">Out of Stock</Badge>
                ) : product.is_low_stock ? (
                  <Badge variant="warning">Low Stock</Badge>
                ) : (
                  <Badge variant="success">Healthy</Badge>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Adjust Stock Modal */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {product.name} · Current: <strong>{product.stock_quantity} units</strong>
            </DialogDescription>
          </DialogHeader>

          {adjustError && (
            <div className="rounded-md border border-status-error-border bg-status-error-bg p-2.5 text-xs text-status-error-text">
              {adjustError}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-charcoal">Adjustment (+ / -)</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setAdjustmentAmount((p) => p - 1)}>
                  -1
                </Button>
                <Input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value, 10) || 0)}
                  className="text-center font-bold tabular-nums"
                />
                <Button variant="outline" size="sm" onClick={() => setAdjustmentAmount((p) => p + 1)}>
                  +1
                </Button>
              </div>
              <p className="text-[11px] text-charcoal-muted mt-1">
                New stock total: <strong>{Math.max(0, product.stock_quantity + adjustmentAmount)} units</strong>
              </p>
            </div>

            <Input
              label="Reason (Optional)"
              placeholder="e.g. Shipment received, defect return"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
            />

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsAdjustOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => adjustStockMutation.mutate()}
                isLoading={adjustStockMutation.isPending}
                disabled={adjustmentAmount === 0}
              >
                Apply Adjustment
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={`Delete ${product.name}?`}
        description="Are you sure you want to delete this product? If this product has sales recorded, Django will protect it from deletion."
        confirmLabel="Yes, Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </motion.div>
  )
}
