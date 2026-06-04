'use client'

import { X } from 'lucide-react'
import { useUIStore } from '@/lib/store'

export function NotificationBanner(): JSX.Element | null {
  const message = useUIStore((s) => s.notificationMessage)
  const clearNotification = useUIStore((s) => s.clearNotification)

  if (!message) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center justify-between rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-blue-800 text-sm"
    >
      <span>{message}</span>
      <button
        onClick={clearNotification}
        aria-label="Dismiss notification"
        className="ml-2 rounded hover:opacity-70 focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
