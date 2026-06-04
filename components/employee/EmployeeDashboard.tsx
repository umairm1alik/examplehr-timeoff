'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BalanceTable } from './BalanceTable'
import { NotificationBanner } from '@/components/ui/notification-banner'
import { useUIStore } from '@/lib/store'
import { fetchBalances } from '@/lib/hcmApi'

interface EmployeeDashboardProps {
  employeeId: string
  employeeName?: string
}

export function EmployeeDashboard({ employeeId, employeeName }: EmployeeDashboardProps): JSX.Element {
  const inFlightLocations = useUIStore((s) => s.inFlightLocations)
  const holdBackgroundUpdate = useUIStore((s) => s.holdBackgroundUpdate)
  const showNotification = useUIStore((s) => s.showNotification)

  const { data, isLoading, error } = useQuery({
    queryKey: ['hcm', 'balances', employeeId],
    queryFn: () => fetchBalances(employeeId),
    refetchInterval: 30_000,
    select: (raw) => raw.balances,
  })

  const prevDataRef = useRef<typeof data>(undefined)

  useEffect(() => {
    if (!data || !prevDataRef.current) {
      prevDataRef.current = data
      return
    }

    const prev = prevDataRef.current
    let hasChanges = false

    for (const current of data) {
      const previous = prev.find((p) => p.locationId === current.locationId)
      if (!previous || previous.balance === current.balance) continue

      // If a mutation is in-flight for this location, hold the update instead of applying it
      if (inFlightLocations.has(current.locationId)) {
        holdBackgroundUpdate({
          locationId: current.locationId,
          balance: current.balance,
          lastUpdated: current.lastUpdated,
        })
      } else {
        hasChanges = true
      }
    }

    if (hasChanges) {
      showNotification('Your balances were updated.')
    }

    prevDataRef.current = data
  }, [data, inFlightLocations, holdBackgroundUpdate, showNotification])

  if (error) throw error

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time-Off Balances</h1>
          {employeeName && (
            <p className="text-gray-500 text-sm mt-1">Viewing as: {employeeName}</p>
          )}
        </div>
      </div>
      <NotificationBanner />
      <BalanceTable employeeId={employeeId} balances={data ?? []} isLoading={isLoading} />
    </div>
  )
}
