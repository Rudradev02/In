import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Tags,
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Layers,
  FolderOpen,
} from "lucide-react"
import { toast } from "sonner"

import { apiClient, ApiClientError } from "@/lib/api-client"
import { type Category } from "@/lib/types"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/ui/ErrorState"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { PageHeader } from "@/components/ui/PageHeader"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { fadeInItem, staggerContainer } from "@/lib/motion"

export function CategoryListPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = React.useState("")

  // Modals
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = React.useState<Category | null>(null)

  // Form state
  const [formData, setFormData] = React.useState({ name: "", description: "" })
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Fetch categories
  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<Category[]>("/categories/"),
  })

  // Filter categories client-side by search term
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm.trim()) return categories
    const term = searchTerm.toLowerCase()
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
    )
  }, [categories, searchTerm])

  // Aggregate stats
  const totalCategories = categories.length
  const totalProductsMapped = categories.reduce((sum, c) => sum + (c.products_count || 0), 0)
  const emptyCategoriesCount = categories.filter((c) => !c.products_count || c.products_count === 0).length

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      apiClient.post<Category>("/categories/", payload),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success(`Category "${newCat.name}" created successfully.`)
      setIsAddOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      if (err instanceof ApiClientError && typeof err.data === "object") {
        setFormErrors(err.data)
      } else {
        toast.error("Failed to create category.")
      }
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) =>
      apiClient.put<Category>(`/categories/${id}/`, data),
    onSuccess: (updatedCat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(`Category "${updatedCat.name}" updated.`)
      setEditingCategory(null)
      resetForm()
    },
    onError: (err: any) => {
      if (err instanceof ApiClientError && typeof err.data === "object") {
        setFormErrors(err.data)
      } else {
        toast.error("Failed to update category.")
      }
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/categories/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success("Category deleted.")
      setDeletingCategory(null)
    },
    onError: (err: any) => {
      if (err instanceof ApiClientError) {
        toast.error(err.getFirstError() || "Cannot delete category.")
      } else {
        toast.error("Failed to delete category.")
      }
    },
  })

  const resetForm = () => {
    setFormData({ name: "", description: "" })
    setFormErrors({})
  }

  const handleOpenAdd = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const handleOpenEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
    })
    setFormErrors({})
    setEditingCategory(category)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormErrors({ name: "Category name is required." })
      return
    }

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim(),
        },
      })
    } else {
      createMutation.mutate({
        name: formData.name.trim(),
        description: formData.description.trim(),
      })
    }
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
        title="Categories"
        description="Organize catalog taxonomy and track product distribution across departments."
        icon={<Tags className="h-6 w-6 text-primary" />}
        actions={
          <Button onClick={handleOpenAdd} className="shadow-xs">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Category
          </Button>
        }
      />

      {/* KPI Overview Chips */}
      <motion.div variants={fadeInItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">Total Categories</p>
            <p className="text-xl font-bold text-charcoal mt-1">{totalCategories}</p>
          </div>
          <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center text-primary">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">Categorized Products</p>
            <p className="text-xl font-bold text-charcoal mt-1">{totalProductsMapped}</p>
          </div>
          <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center text-primary">
            <Package className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">Empty Categories</p>
            <p className="text-xl font-bold text-charcoal mt-1">{emptyCategoriesCount}</p>
          </div>
          <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center text-primary">
            <FolderOpen className="h-4 w-4" />
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={fadeInItem} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
          <Input
            placeholder="Search categories by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-surface"
          />
        </div>
      </motion.div>

      {/* Table Section */}
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
              title="Failed to load categories"
              message="An error occurred while fetching category listings from the server."
              onRetry={() => refetch()}
            />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={searchTerm ? "No matching categories" : "No categories found"}
              description={
                searchTerm
                  ? `No categories match "${searchTerm}". Try a different search term.`
                  : "Organize your inventory by creating your first product category."
              }
              action={
                searchTerm ? (
                  <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                    Clear search
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleOpenAdd}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Create Category
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Category Name</TableHead>
                <TableHead className="w-[45%]">Description</TableHead>
                <TableHead className="w-[15%] text-center">Products</TableHead>
                <TableHead className="w-[10%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((cat) => (
                <TableRow key={cat.id} className="h-12 hover:bg-[#FAFBF9]">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-secondary text-primary flex items-center justify-center shrink-0">
                        <Tags className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold text-charcoal">{cat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-charcoal-muted line-clamp-1">
                      {cat.description || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={cat.products_count && cat.products_count > 0 ? "default" : "outline"}
                    >
                      {cat.products_count ?? 0} {cat.products_count === 1 ? "product" : "products"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(cat)}
                        title="Edit category"
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5 text-charcoal-muted" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingCategory(cat)}
                        title="Delete category"
                        className="h-8 w-8 p-0 hover:text-status-error-text"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-charcoal-muted hover:text-status-error-text" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Add / Edit Category Dialog */}
      <Dialog
        open={isAddOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingCategory(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update category details. Note: Changing the name will reflect across all assigned products."
                  : "Create a new category to group and organize products in your inventory."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <Input
                label="Category Name"
                placeholder="e.g., Electronics, Raw Materials, Office Supplies"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-charcoal">Description</label>
                <textarea
                  className="w-full min-h-[90px] rounded-md border border-border bg-surface px-3 py-2 text-xs text-charcoal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                  placeholder="Optional notes or classification details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                {formErrors.description && (
                  <p className="text-[11px] text-status-error-text">{formErrors.description}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false)
                  setEditingCategory(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null)
        }}
        title={`Delete Category "${deletingCategory?.name}"?`}
        description={
          deletingCategory?.products_count && deletingCategory.products_count > 0
            ? `This category cannot be deleted because it still contains ${deletingCategory.products_count} assigned product(s). Please reassign or delete those products first.`
            : "Are you sure you want to delete this category? This action cannot be undone."
        }
        confirmLabel="Delete Category"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingCategory) {
            deleteMutation.mutate(deletingCategory.id)
          }
        }}
      />
    </motion.div>
  )
}
