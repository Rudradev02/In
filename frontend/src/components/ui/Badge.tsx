import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline" | "terracotta"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-secondary text-secondary-foreground border-transparent",
    success: "bg-status-success-bg text-status-success-text border-status-success-border",
    warning: "bg-status-warning-bg text-status-warning-text border-status-warning-border",
    destructive: "bg-status-error-bg text-status-error-text border-status-error-border",
    outline: "border-border text-charcoal bg-transparent",
    terracotta: "bg-[#FDF0EB] text-accent-dark border-[#F7D8CE]",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 select-none",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
