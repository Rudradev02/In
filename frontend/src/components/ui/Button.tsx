import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost"
  size?: "sm" | "md" | "lg" | "icon"
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer"

    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs active:scale-[0.98]",
      secondary: "bg-secondary text-secondary-foreground hover:bg-[#CFE2D2] active:scale-[0.98]",
      destructive: "bg-status-error-bg text-status-error-text border border-status-error-border hover:bg-[#F9DBD5] active:scale-[0.98]",
      outline: "border border-border bg-surface text-charcoal hover:bg-[#F3F5F2] hover:border-border-dark active:scale-[0.98]",
      ghost: "text-charcoal hover:bg-secondary/60 active:scale-[0.98]",
    }

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-sm gap-1.5",
      md: "h-9 px-4 text-sm rounded-md gap-2",
      lg: "h-11 px-6 text-base rounded-md gap-2.5",
      icon: "h-9 w-9 rounded-md justify-center p-0",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"
