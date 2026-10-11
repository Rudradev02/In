import * as React from "react"
import { cn } from "@/lib/utils"

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto rounded-lg border border-border bg-surface">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-border bg-[#F5F6F3]", className)} {...props} />
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn("border-t border-border bg-surface font-medium", className)} {...props} />
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "h-11 border-b border-border/80 transition-colors hover:bg-secondary/25 data-[state=selected]:bg-secondary/40",
        className
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted select-none",
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2.5 align-middle text-sm text-charcoal", className)} {...props} />
}
