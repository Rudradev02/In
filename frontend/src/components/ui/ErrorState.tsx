import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "./Button"
import { cn } from "@/lib/utils"

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-status-error-border bg-status-error-bg p-6 text-center text-status-error-text",
        className
      )}
    >
      <AlertCircle className="h-8 w-8 mb-2" />
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-1 max-w-sm text-xs opacity-90">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 border-status-error-border bg-surface text-status-error-text hover:bg-white"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  )
}
