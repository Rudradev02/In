import * as React from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "framer-motion"
import { Toaster } from "sonner"

import { AuthProvider, useAuth } from "@/features/auth/AuthContext"
import { LoginPage } from "@/features/auth/LoginPage"
import { RegisterPage } from "@/features/auth/RegisterPage"
import { DashboardPage } from "@/features/dashboard/DashboardPage"
import { ProductListPage } from "@/features/products/ProductListPage"
import { ProductDetailPage } from "@/features/products/ProductDetailPage"
import { CategoryListPage } from "@/features/categories/CategoryListPage"
import { SaleListPage } from "@/features/sales/SaleListPage"
import { SaleCreatePage } from "@/features/sales/SaleCreatePage"
import { UsersPage } from "@/features/users/UsersPage"
import { ForbiddenPage } from "@/features/auth/ForbiddenPage"
import { AppShell } from "@/components/layout/AppShell"
import { type Role } from "@/lib/types"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected Route Guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src="/invlab-icon.png" alt="InvLab" className="h-12 w-12 object-contain animate-pulse" />
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
            Initializing InvLab...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <AppShell>{children}</AppShell>
}

// Role Protected Route Guard
function RoleRoute({
  roles,
  children,
}: {
  roles: Role[]
  children: React.ReactNode
}) {
  const { user } = useAuth()
  if (user?.role && !roles.includes(user.role)) {
    return <ForbiddenPage />
  }
  return <>{children}</>
}

// Public Auth Route Guard
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <img src="/invlab-icon.png" alt="InvLab" className="h-10 w-10 object-contain animate-pulse" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              className: "text-xs font-medium font-sans border-border shadow-md",
            }}
          />
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Protected Workspace Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={["Admin", "Manager"]}>
                    <DashboardPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <ProtectedRoute>
                  <ProductDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <CategoryListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <SaleListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/new"
              element={
                <ProtectedRoute>
                  <SaleCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={["Admin"]}>
                    <UsersPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/403"
              element={
                <ProtectedRoute>
                  <ForbiddenPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MotionConfig>
  </QueryClientProvider>
  )
}
