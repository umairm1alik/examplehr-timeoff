'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge } from './badge'

const STALE_THRESHOLD_MS = 60_000

// Shows a warning badge when data is older than 60 seconds.
// This is a precautionary "may be outdated" indicator — it fires on a timer,
// not because the server has confirmed newer data exists.
export function StaleIndicator({ lastUpdated }: { lastUpdated: string }): JSX.Element | null {
  const [isStale, setIsStale] = useState(() => {
    return Date.now() - new Date(lastUpdated).getTime() >= STALE_THRESHOLD_MS
  })

  useEffect(() => {
    const ageMs = Date.now() - new Date(lastUpdated).getTime()

    if (ageMs >= STALE_THRESHOLD_MS) {
      setIsStale(true)
      return
    }

    // Schedule the badge to appear exactly when the threshold is crossed
    const remaining = STALE_THRESHOLD_MS - ageMs
    const timer = setTimeout(() => setIsStale(true), remaining)
    return () => clearTimeout(timer)
  }, [lastUpdated])

  if (!isStale) return null

  return (
    <Badge
      variant="outline"
      className="gap-1 text-yellow-700 border-yellow-300 bg-yellow-50"
      aria-label="Stale data warning"
    >
      <AlertTriangle className="h-3 w-3" />
      Stale
    </Badge>
  )
}
