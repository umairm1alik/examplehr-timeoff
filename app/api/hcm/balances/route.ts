import { NextRequest, NextResponse } from 'next/server'
import { getAllBalances, sleep, randomBetween } from '@/mocks/hcmData'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const employeeId = searchParams.get('employeeId')

  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
  }

  // Simulate expensive batch call
  await sleep(randomBetween(600, 900))

  const balances = getAllBalances(employeeId)
  return NextResponse.json({ employeeId, balances })
}
