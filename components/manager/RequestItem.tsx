'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ApprovalView } from './ApprovalView'
import type { TimeOffRequest } from '@/lib/types'

interface RequestItemProps {
  request: TimeOffRequest & { employeeName?: string }
}

export function RequestItem({ request }: RequestItemProps): JSX.Element {
  const [showApproval, setShowApproval] = useState(false)

  const formattedDate = new Date(request.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <li className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">
            {request.employeeName ?? request.employeeId}
          </p>
          <p className="text-sm text-gray-500">
            {request.locationId} · {request.days} day{request.days !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-gray-600">{request.reason}</p>
          <p className="text-xs text-gray-400">{formattedDate}</p>
        </div>
        {!showApproval && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowApproval(true)}
            aria-label={`View request from ${request.employeeName ?? request.employeeId}`}
          >
            View
          </Button>
        )}
      </div>

      {showApproval && (
        <div className="mt-4">
          <ApprovalView request={request} onDone={() => setShowApproval(false)} />
        </div>
      )}
    </li>
  )
}
