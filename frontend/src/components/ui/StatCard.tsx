import * as React from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  variant?: "primary" | "sage" | "terracotta" | "warning"
  className?: string
  isCurrency?: boolean
}

export function StatCard({
  title,
  value,
  prefix = "",
  suffix = "",
  subtitle,
  icon,
  variant = "primary",
  className,
  isCurrency = false,
}: StatCardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(value) || 0
  const isReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Animated counter
  const spring = useSpring(0, { stiffness: 45, damping: 15 })
  const display = useTransform(spring, (latest) => {
    if (isCurrency) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(latest)
    }
    return new Intl.NumberFormat("en-IN").format(Math.floor(latest))
  })

  React.useEffect(() => {
    if (isReducedMotion) {
      spring.set(numericValue)
    } else {
      spring.set(numericValue)
    }
  }, [numericValue, spring, isReducedMotion])

  const iconVariants = {
    primary: "bg-[#E6EFE9] text-primary",
    sage: "bg-secondary text-primary",
    terracotta: "bg-[#FDF0EB] text-accent-dark",
    warning: "bg-status-warning-bg text-status-warning-text",
  }

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border bg-surface p-5 shadow-xs transition-all duration-200 hover:border-border-dark",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-charcoal-muted tracking-tight">{title}</span>
        {icon && (
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-md text-sm", iconVariants[variant])}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <div className="text-2xl font-bold tracking-tight text-charcoal tabular-nums">
          {isReducedMotion ? (
            isCurrency ? (
              new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              }).format(numericValue)
            ) : (
              `${prefix}${new Intl.NumberFormat("en-IN").format(numericValue)}${suffix}`
            )
          ) : (
            <motion.span>{display}</motion.span>
          )}
        </div>
      </div>

      {subtitle && <div className="mt-2 text-xs font-medium text-charcoal-muted">{subtitle}</div>}
    </div>
  )
}
