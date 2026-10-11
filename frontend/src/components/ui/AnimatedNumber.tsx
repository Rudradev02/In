import * as React from "react"
import { formatINR, formatNumber } from "@/lib/formatters"

interface AnimatedNumberProps {
  value: number | string
  isCurrency?: boolean
  duration?: number // in ms, default 800ms
  className?: string
}

export function AnimatedNumber({
  value,
  isCurrency = false,
  duration = 800,
  className = "",
}: AnimatedNumberProps) {
  const targetNumber = typeof value === "string" ? parseFloat(value) || 0 : value
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const [displayValue, setDisplayValue] = React.useState<number>(0)

  React.useEffect(() => {
    if (prefersReducedMotion || duration <= 0) {
      return
    }

    let startTime: number | null = null
    const startValue = 0
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic: 1 - (1 - progress)^3
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (targetNumber - startValue) * easeOut

      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        setDisplayValue(targetNumber)
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [targetNumber, duration, prefersReducedMotion])

  const effectiveValue = prefersReducedMotion || duration <= 0 ? targetNumber : displayValue

  return (
    <span className={`tabular-nums ${className}`}>
      {isCurrency
        ? formatINR(effectiveValue)
        : formatNumber(Math.round(effectiveValue))}
    </span>
  )
}
