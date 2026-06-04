import { NextRequest, NextResponse } from 'next/server'
import { getBalance, deductBalance, createRequest } from '@/mocks/hcmData'
import type { SubmitRequestPayload } from '@/lib/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const simulate = request.headers.get('X-HCM-Simulate')
  const body = (await request.json()) as SubmitRequestPayload
  const { employeeId, locationId, days, reason } = body

  if (!employeeId || !locationId || !days || !reason) {
    return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 })
  }

  if (simulate === 'rejection') {
    return NextResponse.json({ error: 'hcm_unavailable' }, { status: 500 })
  }

  const entry = getBalance(employeeId, locationId)
  if (!entry) {
    return NextResponse.json({ error: 'balance_not_found' }, { status: 404 })
  }

  if (entry.balance < days) {
    return NextResponse.json({ error: 'insufficient_balance' }, { status: 400 })
  }

  // Silent failure: return 201 but do NOT update balance (10% random or forced via header)
  if (simulate === 'silent_failure' || (simulate !== 'success' && Math.random() < 0.1)) {
    const req = createRequest(employeeId, locationId, days, reason)
    return NextResponse.json(req, { status: 201 })
  }

  const ok = deductBalance(employeeId, locationId, days)
  if (!ok) {
    return NextResponse.json({ error: 'insufficient_balance' }, { status: 400 })
  }

  const req = createRequest(employeeId, locationId, days, reason)
  return NextResponse.json(req, { status: 201 })
}
