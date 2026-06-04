import { NextRequest, NextResponse } from 'next/server'
import { addBalance, getBalance } from '@/mocks/hcmData'
import type { AnniversaryPayload } from '@/lib/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as AnniversaryPayload
  const { employeeId, locationId, bonusDays } = body

  if (!employeeId || !locationId || bonusDays == null) {
    return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 })
  }

  addBalance(employeeId, locationId, bonusDays)

  const entry = getBalance(employeeId, locationId)
  if (!entry) {
    return NextResponse.json({ error: 'balance_not_found' }, { status: 404 })
  }

  return NextResponse.json({
    employeeId,
    locationId,
    balance: entry.balance,
    lastUpdated: entry.lastUpdated,
  })
}
