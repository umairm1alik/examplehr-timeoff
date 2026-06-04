import { RequestItem } from './RequestItem'
import type { TimeOffRequest } from '@/lib/types'

interface RequestListProps {
  requests: Array<TimeOffRequest & { employeeName?: string }>
}

export function RequestList({ requests }: RequestListProps): JSX.Element {
  if (requests.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12" role="status">
        No pending requests.
      </p>
    )
  }

  return (
    <ul className="space-y-3" aria-label="Pending time-off requests">
      {requests.map((req) => (
        <RequestItem key={req.id} request={req} />
      ))}
    </ul>
  )
}
