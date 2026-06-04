import { NextRequest, NextResponse } from 'next/server'
import { getRequests, getEmployeeName } from '@/mocks/hcmData'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const status = searchParams.get('status') ?? 'pending'

  const requests = getRequests(status).map((req) => ({
    ...req,
    employeeName: getEmployeeName(req.employeeId),
  }))

  return NextResponse.json(requests)
}
