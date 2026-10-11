import * as React from "react"
import { motion } from "framer-motion"
import { fadeInItem } from "@/lib/motion"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon,
  badge,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <motion.div
      variants={fadeInItem}
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-primary shrink-0">{icon}</div>}
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-charcoal-muted leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  )
}
