import * as React from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Boxes,
  Layers,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  Receipt,
  Plus,
  ChevronRight,
  PieChart as PieIcon,
  Package,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts"

import { apiClient } from "@/lib/api-client"
import { type DashboardStats } from "@/lib/types"
import { formatINR, formatDateTime, formatCompactINR } from "@/lib/formatters"
import { StatCard } from "@/components/ui/StatCard"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table"
import { Skeleton } from "@/components/ui/Skeleton"
import { ErrorState } from "@/components/ui/ErrorState"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageHeader } from "@/components/ui/PageHeader"
import { fadeInItem, staggerContainer, criticalPulseVariants } from "@/lib/motion"

export function DashboardPage() {
  const [range, setRange] = React.useState<"7d" | "30d" | "90d">("7d")

  const { data, isLoading, error, refetch } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", range],
    queryFn: () => apiClient.get<DashboardStats>(`/dashboard/stats/?range=${range}`),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Failed to load dashboard data"
        message={error instanceof Error ? error.message : "Unable to reach server."}
        onRetry={() => refetch()}
      />
    )
  }

  const { kpis, revenue_trend, category_distribution, low_stock_products, recent_sales } = data
  const categoryColors = ["#173D32", "#C77B55", "#4B7A66", "#D9A07E", "#255D83", "#829B8E"]

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 text-left"
    >
      {/* Top Banner & Quick Actions */}
      <PageHeader
        title="Workspace Insights"
        description="Live telemetry across product catalog health, inventory levels, and transactional revenue."
        icon={<Boxes className="h-6 w-6 text-primary" />}
        actions={
          <>
            <Link to="/products">
              <Button variant="outline" size="sm">
                <Package className="h-3.5 w-3.5 mr-1" />
                Products
              </Button>
            </Link>
            <Link to="/sales/new">
              <Button size="sm" className="shadow-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Record Sale
              </Button>
            </Link>
          </>
        }
      />

      {/* KPI Cards Grid */}
      <motion.div variants={fadeInItem} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={kpis.total_products}
          icon={<Boxes className="h-4 w-4" />}
          variant="primary"
          subtitle={
            <span className="text-status-success-text flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" /> Catalog items
            </span>
          }
        />
        <StatCard
          title="Stock Units"
          value={kpis.total_stock_units}
          icon={<Layers className="h-4 w-4" />}
          variant="sage"
          subtitle="Total volume on hand"
        />
        <StatCard
          title="Low Stock Alert"
          value={kpis.low_stock_count}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={kpis.low_stock_count > 0 ? "warning" : "sage"}
          subtitle={
            kpis.low_stock_count > 0 ? (
              <span className="text-status-warning-text font-semibold">Needs attention</span>
            ) : (
              <span className="text-status-success-text font-medium">All levels healthy</span>
            )
          }
        />
        <StatCard
          title="Today's Revenue"
          value={kpis.today_revenue}
          isCurrency
          icon={<IndianRupee className="h-4 w-4" />}
          variant="terracotta"
          subtitle={`${kpis.today_sales_count} sale${kpis.today_sales_count === 1 ? "" : "s"} recorded today`}
        />
      </motion.div>

      {/* Main Charts Row */}
      <motion.div variants={fadeInItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/60">
            <div>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Sales trend over time in INR (₹)</CardDescription>
            </div>
            {/* Date Range Selector with layoutId pill */}
            <div className="relative flex items-center gap-1 rounded-md border border-border bg-[#F5F6F3] p-0.5 text-xs">
              {(["7d", "30d", "90d"] as const).map((r) => {
                const isSelected = range === r
                return (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`relative z-10 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer select-none ${
                      isSelected
                        ? "text-primary font-semibold"
                        : "text-charcoal-muted hover:text-charcoal"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="chartRangePill"
                        className="absolute inset-0 rounded bg-surface shadow-xs"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">
                      {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#173D32" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#173D32" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E8E4" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: "#E2E6E3" }}
                    tick={{ fill: "#526058", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatCompactINR(val)}
                    tick={{ fill: "#526058", fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatINR(val), "Revenue"]}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E6E3",
                      borderRadius: "6px",
                      fontSize: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#173D32"
                    strokeWidth={2.2}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    isAnimationActive={true}
                    animationDuration={600}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-charcoal-muted">
              <span>
                Total Lifetime Revenue:{" "}
                <strong className="text-primary font-bold">{formatINR(kpis.total_revenue)}</strong>
              </span>
              <span className="tabular-nums">Live PostgreSQL Aggregate</span>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Bar Chart */}
        <Card className="shadow-xs">
          <CardHeader className="border-b border-border/60 pb-2">
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              Category Volume
            </CardTitle>
            <CardDescription>Product catalog breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            {category_distribution.length > 0 ? (
              <div className="space-y-4">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={category_distribution} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        width={90}
                        tick={{ fill: "#202521", fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(val: any) => [`${val} products`, "Count"]}
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E2E6E3",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="product_count" radius={[0, 4, 4, 0]} animationDuration={600}>
                        {category_distribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 border-t border-border pt-3">
                  {category_distribution.slice(0, 3).map((cat, i) => (
                    <div key={cat.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-charcoal">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColors[i % categoryColors.length] }} />
                        {cat.name}
                      </span>
                      <span className="text-charcoal-muted tabular-nums">{cat.total_stock} units in stock</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="No categories found" description="Add categories to see distribution." />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Section: Low Stock & Recent Transactions */}
      <motion.div variants={fadeInItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Watchlist */}
        <Card className="lg:col-span-1 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-status-warning-text" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>Items needing replenishment</CardDescription>
            </div>
            <Link to="/products?status=low_stock">
              <Button variant="ghost" size="sm" className="text-xs">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-3">
            {low_stock_products.length > 0 ? (
              low_stock_products.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-2.5 rounded-md border border-border bg-[#FCFCFA] hover:border-border-dark transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-charcoal truncate">{prod.name}</p>
                    <p className="text-[10px] text-charcoal-muted tabular-nums">
                      SKU: {prod.sku} · Threshold: {prod.low_stock_threshold}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <motion.div
                      variants={prod.stock_quantity === 0 ? criticalPulseVariants : undefined}
                      initial="initial"
                      animate="pulse"
                    >
                      <Badge variant={prod.stock_quantity === 0 ? "destructive" : "warning"} className="tabular-nums">
                        {prod.stock_quantity === 0 ? "Out of Stock" : `${prod.stock_quantity} Left`}
                      </Badge>
                    </motion.div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Inventory is healthy"
                description="No products are currently under their threshold."
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions Table */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Recent Sales
              </CardTitle>
              <CardDescription>Latest recorded transactions</CardDescription>
            </div>
            <Link to="/sales">
              <Button variant="ghost" size="sm" className="text-xs">
                View history <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recent_sales.length > 0 ? (
              <Table className="border-0 rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Sold By</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent_sales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-[#FAFBF9]">
                      <TableCell>
                        <div className="font-semibold text-xs text-charcoal">{sale.product.name}</div>
                        <div className="text-[10px] font-mono text-charcoal-muted">{sale.product.sku}</div>
                      </TableCell>
                      <TableCell className="text-xs text-charcoal-muted">
                        @{sale.sold_by.username}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums">
                        {sale.quantity}
                      </TableCell>
                      <TableCell className="text-xs text-charcoal-muted tabular-nums">
                        {formatDateTime(sale.created_at)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-primary tabular-nums">
                        {formatINR(sale.total_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6">
                <EmptyState
                  title="No sales yet"
                  description="Record your first sale to start populating history."
                  action={
                    <Link to="/sales/new">
                      <Button size="sm">Record Sale</Button>
                    </Link>
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
