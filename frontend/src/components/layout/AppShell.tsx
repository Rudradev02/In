import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  Tags,
  Receipt,
  Plus,
  LogOut,
  Menu,
  X,
  Boxes,
  Calendar,
} from "lucide-react"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Products", href: "/products", icon: Package },
    { label: "Categories", href: "/categories", icon: Tags },
    { label: "Sales History", href: "/sales", icon: Receipt },
  ]

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const currentDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date())

  return (
    <div className="flex min-h-screen bg-background text-charcoal">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-surface shrink-0">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-primary leading-tight">InvLab</h1>
            <p className="text-[10px] font-medium text-charcoal-muted uppercase tracking-wider">Inventory Hub</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-medium transition-colors select-none",
                  isActive
                    ? "bg-secondary text-primary font-semibold shadow-xs"
                    : "text-charcoal-muted hover:bg-[#F2F4F0] hover:text-charcoal"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-charcoal-muted")} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="border-t border-border p-4 bg-[#F8F9F7]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-charcoal truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.username}
                </p>
                <p className="text-[10px] text-charcoal-muted truncate">@{user?.username}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-charcoal-muted hover:text-status-error-text hover:bg-surface rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-charcoal rounded-md hover:bg-secondary cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-charcoal-muted font-medium">
              <Calendar className="h-3.5 w-3.5 text-charcoal-muted/70" />
              <span>{currentDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/sales/new">
              <Button size="sm" className="shadow-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Record Sale
              </Button>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-surface shadow-xl flex flex-col lg:hidden border-r border-border"
            >
              <div className="flex h-16 items-center justify-between px-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-primary">InvLab</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-charcoal-muted hover:text-charcoal rounded-md cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 px-4 py-6 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-secondary text-primary font-semibold"
                          : "text-charcoal-muted hover:bg-[#F2F4F0] hover:text-charcoal"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>

              <div className="border-t border-border p-4 bg-[#F8F9F7]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-charcoal">{user?.username}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
