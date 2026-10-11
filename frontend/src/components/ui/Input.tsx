import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  shakeOnError?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, id, shakeOnError = true, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-charcoal">
            {label}
          </label>
        )}
        <motion.div
          animate={error && shakeOnError ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-charcoal shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-charcoal-muted/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-status-error-border focus-visible:border-status-error-text focus-visible:ring-status-error-text bg-status-error-bg/20",
              className
            )}
            {...props}
          />
        </motion.div>
        <AnimatePresence>
          {error ? (
            <motion.p
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[11px] font-medium text-status-error-text"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <p className="text-[11px] text-charcoal-muted">{helperText}</p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)
Input.displayName = "Input"
