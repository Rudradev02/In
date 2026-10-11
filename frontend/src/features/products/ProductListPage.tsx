import * as React from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  SlidersHorizontal,
} from "lucide-react"
import { toast } from "sonner"

import { apiClient, ApiClientError } from "@/lib/api-client"
import { type Product, type Category, type PaginatedResponse } from "@/lib/types"
import { formatINR } from "@/lib/formatters"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
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
import { fadeInItem, staggerContainer } from "@/lib/motion"

export function ProductListPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [searchTerm, setSearchTerm] = React.useState(searchParams.get("q") || "")
  const [selectedCategory, setSelectedCategory] = React.useState(searchParams.get("category") || "")
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get("status") || "all")
  const [ordering, setOrdering] = React.useState(searchParams.get("ordering") || "-created_at")

  // Modal states
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const [adjustingProduct, setAdjustingProduct] = React.useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null)

  // Fetch Categories for dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<Category[]>("/categories/"),
  })

  // Fetch Products
  const queryUrl = `/products/?q=${encodeURIComponent(searchTerm)}&category=${selectedCategory}&status=${statusFilter}&ordering=${ordering}`
  const { data: productResponse, isLoading, error, refetch } = useQuery<PaginatedResponse<Product> | Product[]>({
    queryKey: ["products", searchTerm, selectedCategory, statusFilter, ordering],
    queryFn: () => apiClient.get<PaginatedResponse<Product> | Product[]>(queryUrl),
  })

  const products: Product[] = Array.isArray(productResponse)
    ? productResponse
    : productResponse?.results || []

  // Add / Edit Product Form State
  const [formData, setFormData] = React.useState({
    name: "",
    sku: "",
    category_id: "",
    price: "",
    stock_quantity: "",
    low_stock_threshold: "5",
    description: "",
  })
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Stock Adjustment Form State
  const [adjustmentAmount, setAdjustmentAmount] = React.useState<number>(0)
  const [adjustmentReason, setAdjustmentReason] = React.useState("")
  const [adjustError, setAdjustError] = React.useState<string | null>(null)

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post<Product>("/products/", payload),
    onSuccess: (newProd) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success(`${newProd.name} created successfully.`)
      setIsAddOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      if (err instanceof ApiClientError && typeof err.data === "object") {
        setFormErrors(err.data)
      } else {
        toast.error("Failed to create product.")
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      apiClient.patch<Product>(`/products/${id}/`, payload),
    onSuccess: (updatedProd) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success(`${updatedProd.name} updated successfully.`)
      setEditingProduct(null)
      resetForm()
    },
    onError: (err: any) => {
      if (err instanceof ApiClientError && typeof err.data === "object") {
        setFormErrors(err.data)
      } else {
        toast.error("Failed to update product.")
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/products/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success("Product deleted successfully.")
      setDeletingProduct(null)
    },
    onError: (err: any) => {
      const msg = err instanceof ApiClientError ? err.getFirstError() : "Cannot delete product."
      toast.error(msg)
    },
  })

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, adjustment, reason }: { id: number; adjustment: number; reason: string }) =>
      apiClient.post<Product>(`/products/${id}/adjust-stock/`, { adjustment, reason }),
    onSuccess: (updatedProd) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success(`Stock adjusted for ${updatedProd.name}. New quantity: ${updatedProd.stock_quantity}`)
      setAdjustingProduct(null)
      setAdjustmentAmount(0)
      setAdjustmentReason("")
    },
    onError: (err: any) => {
      const msg = err instanceof ApiClientError ? err.getFirstError() : "Failed to adjust stock."
      setAdjustError(msg)
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category_id: categories[0]?.id?.toString() || "",
      price: "",
      stock_quantity: "",
      low_stock_threshold: "5",
      description: "",
    })
    setFormErrors({})
  }

  const openAddModal = () => {
    resetForm()
    if (categories.length > 0) {
      setFormData((prev) => ({ ...prev, category_id: categories[0].id.toString() }))
    }
    setIsAddOpen(true)
  }

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod)
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category_id: prod.category_id?.toString() || prod.category?.id?.toString() || "",
      price: prod.price.toString(),
      stock_quantity: prod.stock_quantity.toString(),
      low_stock_threshold: prod.low_stock_threshold.toString(),
      description: prod.description || "",
    })
    setFormErrors({})
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: formData.name,
      sku: formData.sku,
      category_id: parseInt(formData.category_id, 10),
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      low_stock_threshold: parseInt(formData.low_stock_threshold, 10),
      description: formData.description,
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustingProduct || adjustmentAmount === 0) return
    setAdjustError(null)
    adjustStockMutation.mutate({
      id: adjustingProduct.id,
      adjustment: adjustmentAmount,
      reason: adjustmentReason,
    })
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6 text-left">
      {/* Page Header */}
      <PageHeader
        title="Products & Inventory"
        description="Manage stock levels, SKUs, pricing, and catalog categories."
        actions={
          <ActionGuard role={["Admin", "Manager"]} tooltipMessage="Only Managers and Admins can create products.">
            <Button onClick={openAddModal} size="sm" className="shadow-xs">
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Button>
          </ActionGuard>
        }
      />

      {/* Filter & Search Bar */}
      <motion.div variants={fadeInItem} className="flex flex-col md:flex-row items-center gap-3 bg-surface p-3.5 rounded-lg border border-border">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-muted/70" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 h-9 rounded-md border border-border text-xs text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-52">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-9 rounded-md border border-border px-3 py-1.5 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-border px-3 py-1.5 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Ordering */}
        <div className="w-full md:w-44">
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="w-full h-9 rounded-md border border-border px-3 py-1.5 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="-created_at">Newest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="price">Price (Low to High)</option>
            <option value="-price">Price (High to Low)</option>
            <option value="stock_quantity">Stock (Low to High)</option>
            <option value="-stock_quantity">Stock (High to Low)</option>
          </select>
        </div>
      </motion.div>

      {/* Main Table */}
      <motion.div variants={fadeInItem}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load products"
            message={error instanceof Error ? error.message : "Error contacting server."}
            onRetry={() => refetch()}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try adjusting your search criteria or add your first product."
            action={
              <Button size="sm" onClick={openAddModal}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Product
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price (₹)</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((prod) => (
                <TableRow key={prod.id}>
                  <TableCell>
                    <Link to={`/products/${prod.id}`} className="font-semibold text-xs text-primary hover:underline">
                      {prod.name}
                    </Link>
                    <div className="text-[10px] text-charcoal-muted tabular-nums">SKU: {prod.sku}</div>
                  </TableCell>
                  <TableCell className="text-xs text-charcoal-muted">
                    {prod.category_name || prod.category?.name || "—"}
                  </TableCell>
                  <TableCell className="text-xs font-semibold tabular-nums text-charcoal">
                    {formatINR(prod.price)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <span className="text-xs font-medium text-charcoal">{prod.stock_quantity} units</span>
                    <span className="text-[10px] text-charcoal-muted block">threshold: {prod.low_stock_threshold}</span>
                  </TableCell>
                  <TableCell>
                    {prod.stock_quantity === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : prod.is_low_stock ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">Healthy</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <ActionGuard role={["Admin", "Manager"]} tooltipMessage="Only Managers and Admins can adjust stock.">
                      <Button
                        variant="outline"
                        size="sm"
                        title="Adjust inventory quantity"
                        onClick={() => {
                          setAdjustingProduct(prod)
                          setAdjustmentAmount(0)
                          setAdjustmentReason("")
                          setAdjustError(null)
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                        Adjust
                      </Button>
                    </ActionGuard>

                    <ActionGuard role={["Admin", "Manager"]} tooltipMessage="Only Managers and Admins can edit products.">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Edit product"
                        onClick={() => openEditModal(prod)}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5 text-charcoal-muted hover:text-charcoal" />
                      </Button>
                    </ActionGuard>

                    <ActionGuard role={["Admin", "Manager"]} tooltipMessage="Only Managers and Admins can delete products.">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete product"
                        onClick={() => setDeletingProduct(prod)}
                        className="h-7 w-7 p-0 hover:bg-status-error-bg"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-charcoal-muted hover:text-status-error-text" />
                      </Button>
                    </ActionGuard>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Add / Edit Product Modal */}
      <Dialog
        open={isAddOpen || !!editingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingProduct(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update catalog details and inventory threshold." : "Create a new item in your inventory workspace."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-3.5 pt-2">
            <Input
              label="Product Name"
              placeholder="e.g. Mechanical Keyboard"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="SKU Code"
                placeholder="e.g. ELEC-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                error={formErrors.sku}
                required
              />

              <Select
                label="Category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                error={formErrors.category_id}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Price (₹)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                error={formErrors.price}
                required
              />

              <Input
                label="Stock Qty"
                type="number"
                min="0"
                placeholder="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                error={formErrors.stock_quantity}
                required
              />

              <Input
                label="Low Threshold"
                type="number"
                min="0"
                placeholder="5"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                error={formErrors.low_stock_threshold}
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-charcoal">Description (Optional)</label>
              <textarea
                rows={3}
                placeholder="Enter product description or specifications..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-border p-2.5 text-xs text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddOpen(false)
                  setEditingProduct(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={createMutation.isPending || updateMutation.isPending}>
                {editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Stock Adjustment Modal */}
      <Dialog open={!!adjustingProduct} onOpenChange={(open) => !open && setAdjustingProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {adjustingProduct?.name} · Current Stock: <strong>{adjustingProduct?.stock_quantity} units</strong>
            </DialogDescription>
          </DialogHeader>

          {adjustError && (
            <div className="rounded-md border border-status-error-border bg-status-error-bg p-2.5 text-xs text-status-error-text">
              {adjustError}
            </div>
          )}

          <form onSubmit={handleAdjustSubmit} className="space-y-3 pt-1">
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-charcoal">Adjustment Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustmentAmount((prev) => prev - 1)}
                  className="w-9"
                >
                  -1
                </Button>
                <Input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value, 10) || 0)}
                  className="text-center font-bold tabular-nums"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustmentAmount((prev) => prev + 1)}
                  className="w-9"
                >
                  +1
                </Button>
              </div>
              <p className="text-[11px] text-charcoal-muted mt-1">
                Resulting stock:{" "}
                <strong className="text-charcoal tabular-nums">
                  {Math.max(0, (adjustingProduct?.stock_quantity || 0) + adjustmentAmount)} units
                </strong>
              </p>
            </div>

            <Input
              label="Reason (optional)"
              placeholder="e.g. Shipment received, damaged goods"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
            />

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setAdjustingProduct(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={adjustStockMutation.isPending} disabled={adjustmentAmount === 0}>
                Apply Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title={`Delete ${deletingProduct?.name}?`}
        description="Are you sure you want to delete this product? Products with recorded sales history cannot be deleted."
        confirmLabel="Yes, Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
      />
    </motion.div>
  )
}
