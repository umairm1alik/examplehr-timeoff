'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { fetchBalance, approveRequest } from '@/lib/hcmApi'
import type { TimeOffRequest } from '@/lib/types'

interface ApprovalViewProps {
  request: TimeOffRequest & { employeeName?: string }
  onDone: () => void
}

export function ApprovalView({ request, onDone }: ApprovalViewProps): JSX.Element {
  const queryClient = useQueryClient()
  const [conflictError, setConflictError] = useState<string | null>(null)

  // staleTime 0 + gcTime 0 forces a fresh fetch every time the component mounts.
  // Approve/deny buttons are disabled until this resolves.
  const { data: freshBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['hcm', 'balance', request.employeeId, request.locationId, 'manager-fresh'],
    queryFn: () => fetchBalance(request.employeeId, request.locationId),
    staleTime: 0,
    gcTime: 0,
  })

  const approveMutation = useMutation({
    mutationFn: (action: 'approve' | 'deny') =>
      approveRequest({ requestId: request.id, action, managerId: 'mgr_001' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hcm', 'requests'] })
      onDone()
    },
    onError: (error: unknown) => {
      const e = error as Error & { status?: number }
      if (e.status === 409) {
        setConflictError('Balance is now insufficient. This request cannot be approved.')
      }
    },
  })

  const buttonsDisabled = balanceLoading || approveMutation.isPending

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card shadow-sm">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Employee</span>
          <p className="font-medium">{request.employeeName ?? request.employeeId}</p>
        </div>
        <div>
          <span className="text-gray-500">Location</span>
          <p className="font-medium">{request.locationId}</p>
        </div>
        <div>
          <span className="text-gray-500">Days Requested</span>
          <p className="font-medium">{request.days}</p>
        </div>
        <div>
          <span className="text-gray-500">Current Balance</span>
          {balanceLoading ? (
            <div className="flex items-center gap-1 mt-1">
              <Spinner size="sm" />
              <span className="text-gray-400 text-xs">Loading…</span>
            </div>
          ) : (
            <p className="font-medium" aria-label={`Current balance: ${freshBalance?.balance ?? 'unknown'} days`}>
              {freshBalance?.balance ?? '—'} days
            </p>
          )}
        </div>
      </div>

      <div>
        <span className="text-gray-500 text-sm">Reason</span>
        <p className="text-sm mt-1">{request.reason}</p>
      </div>

      {conflictError && (
        <div role="alert" className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {conflictError}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => approveMutation.mutate('approve')}
          disabled={buttonsDisabled}
          aria-label="Approve request"
        >
          {approveMutation.isPending ? <Spinner size="sm" className="mr-1" /> : null}
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => approveMutation.mutate('deny')}
          disabled={buttonsDisabled}
          aria-label="Deny request"
        >
          Deny
        </Button>
        <Button size="sm" variant="outline" onClick={onDone} aria-label="Cancel">
          Cancel
        </Button>
      </div>
    </div>
  )
}
