'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export interface RequestFormProps {
  balance: number
  locationId: string
  employeeId: string
  onSubmit: (payload: { days: number; reason: string }) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function RequestForm({
  balance,
  locationId,
  onSubmit,
  onCancel,
  isSubmitting,
}: RequestFormProps): JSX.Element {
  const today = new Date().toISOString().split('T')[0]!
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState('')

  const days = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000) + 1,
  )

  const isOverBalance = days > balance
  const canSubmit = !isSubmitting && !isOverBalance && reason.trim().length > 0

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ days, reason: reason.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3" aria-label="Time-off request form">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`start-${locationId}`} className="block text-xs font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            id={`start-${locationId}`}
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Start date"
          />
        </div>
        <div>
          <label htmlFor={`end-${locationId}`} className="block text-xs font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            id={`end-${locationId}`}
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="End date"
          />
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Days requested:{' '}
        <strong className={isOverBalance ? 'text-red-600' : 'text-gray-900'}>{days}</strong>
        {isOverBalance && (
          <span className="ml-2 text-red-600 text-xs" role="alert">
            Exceeds available balance of {balance} days
          </span>
        )}
      </p>

      <div>
        <label htmlFor={`reason-${locationId}`} className="block text-xs font-medium text-gray-700 mb-1">
          Reason
        </label>
        <textarea
          id={`reason-${locationId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Brief reason for time off…"
          className="block w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Reason for time off"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!canSubmit} aria-label="Submit request">
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-1" />
              Submitting…
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Cancel request form"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
