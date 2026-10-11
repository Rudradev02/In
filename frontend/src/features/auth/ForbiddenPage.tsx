import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldAlert, ArrowLeft, Receipt, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { usePermission } from "@/lib/permissions"
import { smoothTransition } from "@/lib/motion"

export function ForbiddenPage() {
  const { role, isCashier } = usePermission()

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={smoothTransition}
        className="max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm space-y-5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FDF0EB] text-accent-dark">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-status-error-bg text-status-error-text border border-status-error-border">
            403 · Access Restricted
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            Permission Denied
          </h1>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Your current account role (
            <span className="font-semibold text-charcoal">{role || "User"}</span>
            ) does not have authorization to view this resource or perform this action.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          {isCashier ? (
            <Link to="/sales/new">
              <Button size="sm" className="w-full sm:w-auto">
                <Receipt className="h-3.5 w-3.5 mr-1.5" />
                Open Sales Terminal
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button size="sm" className="w-full sm:w-auto">
                <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                Return to Dashboard
              </Button>
            </Link>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
