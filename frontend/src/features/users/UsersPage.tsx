import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  UserPlus,
  ShieldCheck,
  UserX,
  UserCheck,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { apiClient, ApiClientError } from "@/lib/api-client"
import { type ManagedUser, type Role } from "@/lib/types"
import { formatDate } from "@/lib/formatters"
import { useAuth } from "@/features/auth/AuthContext"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/ui/ErrorState"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { fadeInItem, staggerContainer } from "@/lib/motion"

export function UsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  const [searchTerm, setSearchTerm] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [deactivatingUser, setDeactivatingUser] = React.useState<ManagedUser | null>(null)
  const [activatingUser, setActivatingUser] = React.useState<ManagedUser | null>(null)

  // Form states
  const [formUsername, setFormUsername] = React.useState("")
  const [formPassword, setFormPassword] = React.useState("")
  const [formEmail, setFormEmail] = React.useState("")
  const [formFirstName, setFormFirstName] = React.useState("")
  const [formLastName, setFormLastName] = React.useState("")
  const [formRole, setFormRole] = React.useState<Role>("Cashier")
  const [formError, setFormError] = React.useState<string | null>(null)

  // Fetch users
  const { data: usersResponse, isLoading, error, refetch } = useQuery<ManagedUser[] | { results: ManagedUser[] }>({
    queryKey: ["admin-users"],
    queryFn: () => apiClient.get<ManagedUser[] | { results: ManagedUser[] }>("/users/"),
  })

  const users: ManagedUser[] = Array.isArray(usersResponse)
    ? usersResponse
    : usersResponse?.results || []

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post<ManagedUser>("/users/", payload),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success(`User '${newUser.username}' created successfully as ${newUser.role}.`)
      setIsCreateOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      const msg = err instanceof ApiClientError ? err.getFirstError() : "Failed to create user."
      setFormError(msg)
    },
  })

  // Change Role Mutation
  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: Role }) =>
      apiClient.post<ManagedUser>(`/users/${userId}/change-role/`, { role }),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success(`Role for '${updatedUser.username}' changed to ${updatedUser.role}.`)
    },
    onError: (err: any) => {
      const msg = err instanceof ApiClientError ? err.getFirstError() : "Failed to change role."
      toast.error(msg)
    },
  })

  // Toggle Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      apiClient.post<ManagedUser>(`/users/${userId}/toggle-active/`, { is_active: isActive }),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success(`User '${updatedUser.username}' has been ${updatedUser.is_active ? "activated" : "deactivated"}.`)
      setDeactivatingUser(null)
      setActivatingUser(null)
    },
    onError: (err: any) => {
      const msg = err instanceof ApiClientError ? err.getFirstError() : "Failed to update user status."
      toast.error(msg)
      setDeactivatingUser(null)
      setActivatingUser(null)
    },
  })

  const resetForm = () => {
    setFormUsername("")
    setFormPassword("")
    setFormEmail("")
    setFormFirstName("")
    setFormLastName("")
    setFormRole("Cashier")
    setFormError(null)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formUsername.trim()) {
      setFormError("Username is required.")
      return
    }
    if (!formPassword || formPassword.length < 8) {
      setFormError("Password must be at least 8 characters.")
      return
    }

    createMutation.mutate({
      username: formUsername.trim(),
      password: formPassword,
      email: formEmail.trim() || undefined,
      first_name: formFirstName.trim(),
      last_name: formLastName.trim(),
      role: formRole,
    })
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case "Admin":
        return "default"
      case "Manager":
        return "outline"
      case "Cashier":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6 text-left">
      <PageHeader
        title="User & Access Control"
        description="Manage system operator accounts, assign security roles, and enforce session authorization."
        badge={
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
            <ShieldCheck className="h-3 w-3" /> Admin Protected
          </span>
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm()
              setIsCreateOpen(true)
            }}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Add Operator
          </Button>
        }
      />

      {/* Filter Bar */}
      <motion.div variants={fadeInItem} className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 rounded-lg border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-muted" />
          <input
            type="text"
            placeholder="Search by username, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 h-9 rounded-md border border-border text-xs text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-border px-3 py-1.5 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Cashier">Cashier</option>
          </select>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={fadeInItem}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Users"
            message={error instanceof Error ? error.message : "Error contacting user management API."}
            onRetry={() => refetch()}
          />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description={searchTerm ? "No user accounts match the search criteria." : "No users exist in the system."}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8F8F5]/80 hover:bg-[#F8F8F5]">
                  <TableHead className="w-56 text-[11px] uppercase tracking-wider font-semibold text-charcoal-muted">
                    User / Operator
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-charcoal-muted">
                    Email
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-charcoal-muted">
                    Role
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-charcoal-muted">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-charcoal-muted">
                    Date Joined
                  </TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wider font-semibold text-charcoal-muted">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isSelf = currentUser?.id === user.id

                  return (
                    <TableRow key={user.id} className="h-11 transition-colors hover:bg-[#F8F8F5]/50">
                      <TableCell className="font-medium text-xs text-charcoal py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-primary font-bold text-[11px] uppercase">
                            {user.username.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-semibold">{user.username}</span>
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] text-primary font-medium bg-secondary px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                            <span className="block text-[11px] text-charcoal-muted">
                              {[user.first_name, user.last_name].filter(Boolean).join(" ") || "No Name"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-charcoal py-2">
                        {user.email || <span className="text-charcoal-muted">—</span>}
                      </TableCell>

                      <TableCell className="py-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-2">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-status-success-bg px-2 py-0.5 text-[10px] font-medium text-status-success-text">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-status-error-bg px-2 py-0.5 text-[10px] font-medium text-status-error-text">
                            <span className="h-1.5 w-1.5 rounded-full bg-status-error-text" /> Inactive
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-charcoal-muted py-2">
                        {formatDate(user.date_joined)}
                      </TableCell>

                      <TableCell className="text-right py-2">
                        <div className="flex items-center justify-end gap-2">
                          {/* Role selector dropdown */}
                          <select
                            value={user.role}
                            disabled={isSelf || changeRoleMutation.isPending}
                            onChange={(e) => {
                              const newRole = e.target.value as Role
                              if (newRole !== user.role) {
                                changeRoleMutation.mutate({ userId: user.id, role: newRole })
                              }
                            }}
                            className={`h-7 rounded border border-border px-2 text-[11px] text-charcoal focus:outline-none focus:ring-1 focus:ring-primary ${
                              isSelf ? "opacity-50 cursor-not-allowed bg-background" : "bg-surface"
                            }`}
                            title={isSelf ? "You cannot change your own role." : "Change user role"}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Cashier">Cashier</option>
                          </select>

                          {/* Deactivate / Activate button */}
                          {user.is_active ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf || toggleActiveMutation.isPending}
                              onClick={() => setDeactivatingUser(user)}
                              className="h-7 px-2 text-[11px] text-status-error-text border-status-error-border hover:bg-status-error-bg"
                              title={isSelf ? "You cannot deactivate your own account." : "Deactivate user"}
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={toggleActiveMutation.isPending}
                              onClick={() => setActivatingUser(user)}
                              className="h-7 px-2 text-[11px] text-primary border-primary/30 hover:bg-secondary/40"
                              title="Activate user"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Add User Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add System Operator</DialogTitle>
            <DialogDescription>
              Create a new user account with assigned role permissions.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-md border border-status-error-border bg-status-error-bg p-2.5 text-xs text-status-error-text">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-3.5 pt-2">
            <Input
              label="Username *"
              placeholder="e.g. cashier_john"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              required
            />

            <Input
              label="Password *"
              type="password"
              placeholder="Minimum 8 characters"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="First name"
                value={formFirstName}
                onChange={(e) => setFormFirstName(e.target.value)}
              />
              <Input
                label="Last Name"
                placeholder="Last name"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value)}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="operator@invlab.local"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
            />

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-charcoal">Role Authorization *</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as Role)}
                className="w-full h-9 rounded-md border border-border px-3 py-1.5 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="Cashier">Cashier (Sales checkout & own receipts only)</option>
                <option value="Manager">Manager (Full catalog CRUD, price edits & reports)</option>
                <option value="Admin">Admin (Full administrative & user access)</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={createMutation.isPending}>
                Create Operator
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Modal */}
      <ConfirmDialog
        open={!!deactivatingUser}
        onOpenChange={(open) => !open && setDeactivatingUser(null)}
        title={`Deactivate ${deactivatingUser?.username}?`}
        description="Deactivating this account will immediately revoke access and terminate all active login sessions in accordance with security policies."
        confirmLabel="Deactivate Account"
        variant="destructive"
        isLoading={toggleActiveMutation.isPending}
        onConfirm={() => {
          if (deactivatingUser) {
            toggleActiveMutation.mutate({ userId: deactivatingUser.id, isActive: false })
          }
        }}
      />

      {/* Activate Confirmation Modal */}
      <ConfirmDialog
        open={!!activatingUser}
        onOpenChange={(open) => !open && setActivatingUser(null)}
        title={`Activate ${activatingUser?.username}?`}
        description="Activating this account will restore operator login access."
        confirmLabel="Activate Account"
        isLoading={toggleActiveMutation.isPending}
        onConfirm={() => {
          if (activatingUser) {
            toggleActiveMutation.mutate({ userId: activatingUser.id, isActive: true })
          }
        }}
      />
    </motion.div>
  )
}
