import * as React from "react"
import { useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Receipt,
  Package,
  AlertTriangle,
  CheckCircle2,
  Minus,
  Plus,
  Printer,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { apiClient, ApiClientError } from "@/lib/api-client"
import { type Product, type Sale, type PaginatedResponse } from "@/lib/types"
import { formatINR, formatNumber, formatDateTime } from "@/lib/formatters"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/Dialog"
import { PageHeader } from "@/components/ui/PageHeader"
import { fadeInItem, staggerContainer } from "@/lib/motion"

export function SaleCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Form states
  const [selectedProductId, setSelectedProductId] = React.useState<string>("")
  const [quantity, setQuantity] = React.useState<number>(1)
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Success receipt dialog
  const [completedSale, setCompletedSale] = React.useState<Sale | null>(null)

  // Fetch active products
  const { data: productResponse, isLoading: isLoadingProducts } = useQuery<
    PaginatedResponse<Product> | Product[]
  >({
    queryKey: ["products-active"],
    queryFn: () => apiClient.get<PaginatedResponse<Product> | Product[]>("/products/?ordering=name"),
  })

  const products: Product[] = React.useMemo(() => {
    return Array.isArray(productResponse)
      ? productResponse
      : productResponse?.results || []
  }, [productResponse])

  // Current selected product object
  const activeProduct = React.useMemo(() => {
    if (!selectedProductId) return null
    return products.find((p) => String(p.id) === selectedProductId) || null
  }, [products, selectedProductId])

  // Calculation helpers
  const unitPrice = activeProduct ? Number(activeProduct.price) : 0
  const totalPrice = unitPrice * (quantity || 0)
  const currentStock = activeProduct ? activeProduct.stock_quantity : 0
  const remainingStock = currentStock - (quantity || 0)
  const isOutOfStock = currentStock <= 0
  const isInsufficientStock = quantity > currentStock

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId)
    if (formErrors.product_id) setFormErrors((prev) => ({ ...prev, product_id: "" }))
  }

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty)
    if (formErrors.quantity) setFormErrors((prev) => ({ ...prev, quantity: "" }))
  }

  // Mutation
  const createSaleMutation = useMutation({
    mutationFn: (payload: { product_id: number; quantity: number }) =>
      apiClient.post<Sale>("/sales/", payload),
    onSuccess: (newSale) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success(
        `Sale recorded: ${newSale.quantity}x ${newSale.product.name} for ${formatINR(
          newSale.total_price
        )}`
      )
      setCompletedSale(newSale)
    },
    onError: (err: any) => {
      if (err instanceof ApiClientError && typeof err.data === "object") {
        setFormErrors(err.data)
      } else {
        toast.error("Failed to record sale. Check stock availability.")
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const errors: Record<string, string> = {}
    if (!selectedProductId) {
      errors.product_id = "Please select a product."
    }
    if (!quantity || quantity < 1) {
      errors.quantity = "Quantity must be at least 1."
    } else if (activeProduct && quantity > activeProduct.stock_quantity) {
      errors.quantity = `Cannot sell more than ${activeProduct.stock_quantity} available units.`
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    createSaleMutation.mutate({
      product_id: Number(selectedProductId),
      quantity: Number(quantity),
    })
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Breadcrumb Navigation */}
      <motion.div variants={fadeInItem} className="flex items-center gap-3">
        <Link
          to="/sales"
          className="inline-flex items-center text-xs text-charcoal-muted hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Sales History
        </Link>
      </motion.div>

      {/* Header */}
      <PageHeader
        title="Record Sale"
        description="Dispatch inventory and create an authoritative transaction with real-time stock deduction."
        icon={<Receipt className="h-6 w-6 text-primary" />}
      />

      {/* Main Grid: Form & Preview */}
      <motion.div variants={fadeInItem} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="md:col-span-7 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-charcoal flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Sale Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Product Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal">Select Product *</label>
                  <Select
                    value={selectedProductId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    disabled={isLoadingProducts}
                  >
                    <option value="">-- Choose a product from inventory --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                        {p.name} ({p.sku}) — {formatINR(p.price)} [{p.stock_quantity} in stock]
                        {p.stock_quantity <= 0 ? " (OUT OF STOCK)" : ""}
                      </option>
                    ))}
                  </Select>
                  {formErrors.product_id && (
                    <p className="text-[11px] text-status-error-text">{formErrors.product_id}</p>
                  )}
                </div>

                {/* Selected Product Quick Info Card */}
                {activeProduct && (
                  <div className="rounded-lg border border-border bg-[#FAFBF9] p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-charcoal">{activeProduct.name}</span>
                      <Badge
                        variant={
                          activeProduct.stock_quantity <= 0
                            ? "destructive"
                            : activeProduct.is_low_stock
                            ? "warning"
                            : "default"
                        }
                      >
                        {activeProduct.stock_quantity <= 0
                          ? "Out of Stock"
                          : activeProduct.is_low_stock
                          ? `Low Stock (${activeProduct.stock_quantity} left)`
                          : `In Stock (${activeProduct.stock_quantity} left)`}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-charcoal-muted text-[11px]">
                      <span>SKU: <strong className="font-mono text-charcoal">{activeProduct.sku}</strong></span>
                      <span>Category: <strong className="text-charcoal">{activeProduct.category?.name || activeProduct.category_name || "Uncategorized"}</strong></span>
                      <span>Unit Price: <strong className="text-primary">{formatINR(activeProduct.price)}</strong></span>
                    </div>
                  </div>
                )}

                {/* Quantity Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal">Quantity to Sell *</label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 shrink-0"
                      disabled={quantity <= 1}
                      onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={activeProduct ? activeProduct.stock_quantity : undefined}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                      className="text-center font-bold text-sm"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 shrink-0"
                      disabled={activeProduct ? quantity >= activeProduct.stock_quantity : false}
                      onClick={() => handleQuantityChange(quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {formErrors.quantity && (
                    <p className="text-[11px] text-status-error-text">{formErrors.quantity}</p>
                  )}
                  {formErrors.detail && (
                    <p className="text-[11px] text-status-error-text">{formErrors.detail}</p>
                  )}
                </div>

                {/* Stock Warning Notice */}
                {isOutOfStock && activeProduct && (
                  <div className="flex items-center gap-2 p-3 bg-status-error-bg text-status-error-text rounded-md border border-red-200 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>This item is currently out of stock. Adjust inventory before recording sales.</span>
                  </div>
                )}

                {isInsufficientStock && !isOutOfStock && activeProduct && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Selected quantity ({quantity}) exceeds available stock ({currentStock}).</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <Link to="/sales">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={
                      !selectedProductId ||
                      quantity <= 0 ||
                      isOutOfStock ||
                      isInsufficientStock ||
                      createSaleMutation.isPending
                    }
                    isLoading={createSaleMutation.isPending}
                    className="shadow-xs"
                  >
                    Confirm & Record Sale
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary Preview */}
        <div className="md:col-span-5 space-y-6">
          <Card className="shadow-xs bg-[#FAFBF9]">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-charcoal-muted flex items-center justify-between">
                <span>Transaction Preview</span>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              {activeProduct ? (
                <>
                  <div className="space-y-2 pb-3 border-b border-border">
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted">Item:</span>
                      <span className="font-semibold text-charcoal text-right">{activeProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted">SKU:</span>
                      <span className="font-mono text-charcoal">{activeProduct.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted">Unit Price:</span>
                      <span className="font-medium text-charcoal">{formatINR(unitPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted">Units to Deduct:</span>
                      <span className="font-semibold text-charcoal">{formatNumber(quantity)}</span>
                    </div>
                  </div>

                  {/* Stock Impact Visual */}
                  <div className="rounded-md bg-surface border border-border p-3 space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Stock Impact</p>
                    <div className="flex items-center justify-between text-xs">
                      <span>Current Stock:</span>
                      <span className="font-semibold">{currentStock} units</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Post-Sale Stock:</span>
                      <span
                        className={`font-semibold ${
                          remainingStock < 0
                            ? "text-status-error-text"
                            : remainingStock <= activeProduct.low_stock_threshold
                            ? "text-status-warning-text"
                            : "text-status-success-text"
                        }`}
                      >
                        {remainingStock} units
                      </span>
                    </div>
                  </div>

                  {/* Bill Calculation */}
                  <div className="pt-2 space-y-1.5 border-t border-dashed border-border">
                    <div className="flex justify-between text-charcoal-muted">
                      <span>Subtotal:</span>
                      <span>{formatINR(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-charcoal-muted">
                      <span>Applicable Tax:</span>
                      <span>₹0.00</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-primary pt-2 border-t border-border">
                      <span>Total Due:</span>
                      <span>{formatINR(totalPrice)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-charcoal-muted space-y-2">
                  <Package className="h-8 w-8 mx-auto text-charcoal-muted/50" />
                  <p className="text-xs">Select a product to view the real-time invoice calculation.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Sale Success Receipt Modal */}
      <Dialog
        open={!!completedSale}
        onOpenChange={(open) => {
          if (!open) {
            setCompletedSale(null)
            navigate("/sales")
          }
        }}
      >
        <DialogContent className="max-w-md">
          {completedSale && (
            <div className="space-y-6">
              <div className="text-center border-b border-border pb-4">
                <div className="flex justify-center mb-2">
                  <img src="/invlab-logo.png" alt="InvLab" className="h-7 w-auto object-contain" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-success-bg text-status-success-text text-[11px] font-semibold mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Sale Recorded Successfully</span>
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-charcoal">
                  #TX-{String(completedSale.id).padStart(6, "0")}
                </div>
                <p className="text-[11px] text-charcoal-muted mt-0.5">
                  {formatDateTime(completedSale.created_at)}
                </p>
              </div>

              <div className="text-xs space-y-1.5 bg-[#FAFBF9] p-3 rounded-md border border-border">
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Item:</span>
                  <span className="font-semibold text-charcoal">{completedSale.product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Quantity:</span>
                  <span className="font-semibold text-charcoal">{completedSale.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Total Amount:</span>
                  <span className="font-bold text-primary">{formatINR(completedSale.total_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Cashier / Staff:</span>
                  <span className="font-semibold text-charcoal">
                    {completedSale.sold_by?.full_name || completedSale.sold_by?.username}
                  </span>
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCompletedSale(null)
                    navigate("/sales")
                  }}
                >
                  Return to Sales
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintReceipt}
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    Print
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCompletedSale(null)
                      setSelectedProductId("")
                      setQuantity(1)
                    }}
                  >
                    Record Another
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
