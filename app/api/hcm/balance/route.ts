import { NextRequest, NextResponse } from 'next/server'
import { getBalance, sleep, randomBetween } from '@/mocks/hcmData'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const employeeId = searchParams.get('employeeId')
  const locationId = searchParams.get('locationId')

  if (!employeeId || !locationId) {
    return NextResponse.json({ error: 'employeeId and locationId are required' }, { status: 400 })
  }

  // Simulate real-time read latency
  await sleep(randomBetween(200, 400))

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
