// MSW handlers that mirror route handler logic. Used in integration tests and Storybook.
import { http, HttpResponse } from 'msw'

export interface MockBalanceStore {
  [employeeId: string]: {
    [locationId: string]: { balance: number; lastUpdated: string }
  }
}

function makeDefaultStore(): MockBalanceStore {
  const ts = new Date().toISOString()
  return {
    emp_001: {
      Lahore:  { balance: 10, lastUpdated: ts },
      Karachi: { balance: 8,  lastUpdated: ts },
      Dubai:   { balance: 12, lastUpdated: ts },
      London:  { balance: 15, lastUpdated: ts },
    },
  }
}

let balanceStore: MockBalanceStore = makeDefaultStore()

let requestStore: Array<{
  id: string
  employeeId: string
  locationId: string
  days: number
  reason: string
  status: string
  createdAt: string
  employeeName: string
}> = []

let requestCounter = 1

export function resetMockStore(initial?: MockBalanceStore): void {
  balanceStore = initial ?? makeDefaultStore()
  requestStore = []
  requestCounter = 1
}

export const handlers = [
  http.get('/api/hcm/balance', ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId') ?? ''
    const locationId = url.searchParams.get('locationId') ?? ''
    const entry = balanceStore[employeeId]?.[locationId]
    if (!entry) return HttpResponse.json({ error: 'not_found' }, { status: 404 })
    return HttpResponse.json({ employeeId, locationId, balance: entry.balance, lastUpdated: entry.lastUpdated })
  }),

  http.get('/api/hcm/balances', ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId') ?? ''
    const entries = balanceStore[employeeId]
    if (!entries) return HttpResponse.json({ employeeId, balances: [] })
    const balances = Object.entries(entries).map(([locationId, e]) => ({
      locationId,
      balance: e.balance,
      lastUpdated: e.lastUpdated,
    }))
    return HttpResponse.json({ employeeId, balances })
  }),

  http.post('/api/hcm/request', async ({ request }) => {
    const simulate = request.headers.get('X-HCM-Simulate')
    const body = await request.json() as {
      employeeId: string
      locationId: string
      days: number
      reason: string
    }
    const { employeeId, locationId, days, reason } = body

    if (simulate === 'rejection') {
      return HttpResponse.json({ error: 'hcm_unavailable' }, { status: 500 })
    }

    const entry = balanceStore[employeeId]?.[locationId]
    if (!entry) return HttpResponse.json({ error: 'not_found' }, { status: 404 })
    if (entry.balance < days) {
      return HttpResponse.json({ error: 'insufficient_balance' }, { status: 400 })
    }

    const req = {
      id: `req_${String(requestCounter++).padStart(3, '0')}`,
      employeeId,
      locationId,
      days,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      employeeName: 'Ahmed Khan',
    }
    requestStore.push(req)

    // Silent failure: report success but DO NOT deduct balance
    if (simulate !== 'silent_failure') {
      entry.balance -= days
      entry.lastUpdated = new Date().toISOString()
    }

    return HttpResponse.json(req, { status: 201 })
  }),

  http.post('/api/hcm/approve', async ({ request }) => {
    const body = await request.json() as { requestId: string; action: string; managerId: string }
    const { requestId, action } = body
    const req = requestStore.find((r) => r.id === requestId)
    if (!req) return HttpResponse.json({ error: 'not_found' }, { status: 404 })

    if (action === 'approve') {
      const entry = balanceStore[req.employeeId]?.[req.locationId]
      if (!entry || entry.balance < req.days) {
        return HttpResponse.json({ error: 'insufficient_balance' }, { status: 409 })
      }
      req.status = 'approved'
    } else {
      req.status = 'denied'
    }
    return HttpResponse.json(req)
  }),

  http.get('/api/hcm/requests', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') ?? 'pending'
    const filtered = requestStore.filter((r) => r.status === status)
    return HttpResponse.json(filtered)
  }),

  http.post('/api/hcm/anniversary', async ({ request }) => {
    const body = await request.json() as { employeeId: string; locationId: string; bonusDays: number }
    const { employeeId, locationId, bonusDays } = body
    const entry = balanceStore[employeeId]?.[locationId]
    if (!entry) return HttpResponse.json({ error: 'not_found' }, { status: 404 })
    entry.balance += bonusDays
    entry.lastUpdated = new Date().toISOString()
    return HttpResponse.json({ employeeId, locationId, balance: entry.balance, lastUpdated: entry.lastUpdated })
  }),
]
