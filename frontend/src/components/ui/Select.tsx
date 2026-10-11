import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, children, ...props }, ref) => {
    const generatedId = React.useId()
    const selectId = id || generatedId

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-charcoal">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-charcoal shadow-xs transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-status-error-border focus-visible:border-status-error-text focus-visible:ring-status-error-text",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p className="text-[11px] font-medium text-status-error-text">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-charcoal-muted">{helperText}</p>
        ) : null}
      </div>
    )
  }
)
Select.displayName = "Select"
