import { NextRequest, NextResponse } from 'next/server'
import { getRequest, getBalance, updateRequestStatus } from '@/mocks/hcmData'
import type { ApprovePayload } from '@/lib/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as ApprovePayload
  const { requestId, action, managerId } = body

  if (!requestId || !action || !managerId) {
    return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 })
  }

  const req = getRequest(requestId)
  if (!req) {
    return NextResponse.json({ error: 'request_not_found' }, { status: 404 })
  }

  if (req.status !== 'pending') {
    return NextResponse.json({ error: 'request_not_pending' }, { status: 409 })
  }

  if (action === 'approve') {
    const entry = getBalance(req.employeeId, req.locationId)
    if (!entry || entry.balance < req.days) {
      return NextResponse.json({ error: 'insufficient_balance' }, { status: 409 })
    }
    updateRequestStatus(requestId, 'approved')
  } else if (action === 'deny') {
    updateRequestStatus(requestId, 'denied')
  } else {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 })
  }

  return NextResponse.json(getRequest(requestId))
}
