'use client'

import { useQuery } from '@tanstack/react-query'
import { RequestList } from './RequestList'
import { Spinner } from '@/components/ui/spinner'
import { fetchRequests } from '@/lib/hcmApi'

export function ManagerDashboard(): JSX.Element {
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['hcm', 'requests', 'pending'],
    queryFn: () => fetchRequests('pending'),
    refetchInterval: 60_000,
  })

  if (error) throw error

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pending Requests</h1>
        {isLoading && <Spinner aria-label="Loading requests" />}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12" role="status" aria-label="Loading pending requests">
          <Spinner size="lg" />
        </div>
      ) : (
        <RequestList requests={requests ?? []} />
      )}
    </div>
  )
}
