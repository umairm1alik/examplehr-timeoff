import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { EmployeeDashboard } from '@/components/employee/EmployeeDashboard'
import { handlers, resetMockStore } from '@/mocks/handlers'
import { useUIStore } from '@/lib/store'

const server = setupServer(...handlers)

function resetZustand() {
  useUIStore.setState({
    openForms: new Set(),
    inFlightLocations: new Set(),
    pendingBackgroundUpdates: new Map(),
    requestStatuses: new Map(),
    notificationMessage: null,
  })
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
beforeEach(resetZustand)
afterEach(() => {
  server.resetHandlers()
  resetMockStore()
  resetZustand()
})
afterAll(() => server.close())

function renderDashboard() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchInterval: false },
      mutations: { retry: false },
    },
  })
  const utils = render(
    <QueryClientProvider client={qc}>
      <EmployeeDashboard employeeId="emp_001" employeeName="Ahmed Khan" />
    </QueryClientProvider>,
  )
  return { ...utils, qc }
}

describe('Integration: Employee flow', () => {
  it('happy path: mutation reaches onMutate and eventually reaches onSettled confirmed state', async () => {
    renderDashboard()

    // Wait for initial load
    await waitFor(
      () => expect(screen.getAllByLabelText(/\d+ days available/i).length).toBeGreaterThan(0),
      { timeout: 5000 },
    )

    // Open the request form
    await userEvent.click(screen.getByRole('button', { name: /request time off for lahore/i }))

    // Fill in the reason
    const reasonInput = screen.getByLabelText(/reason/i)
    await userEvent.type(reasonInput, 'Annual leave')

    // Submit — wrap in act so React flushes all synchronous effects
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /submit request/i }))
    })

    // The Zustand store's inFlightLocations should have Lahore set by onMutate
    await waitFor(
      () => {
        const { inFlightLocations, requestStatuses } = useUIStore.getState()
        // Either still in-flight (onMutate ran) or already settled (onSettled ran)
        const status = requestStatuses.get('Lahore')
        expect(
          inFlightLocations.has('Lahore') ||
            status === 'optimistic-pending' ||
            status === 'confirmed',
        ).toBe(true)
      },
      { timeout: 5000 },
    )

    // Eventually the mutation settles and the status becomes 'confirmed'
    await waitFor(
      () => {
        const status = useUIStore.getState().requestStatuses.get('Lahore')
        expect(status).toBe('confirmed')
      },
      { timeout: 10000 },
    )
  })

  it('HCM rejection rollback: onError fires and requestStatus becomes rolled-back', async () => {
    server.use(
      http.post('/api/hcm/request', () =>
        HttpResponse.json({ error: 'insufficient_balance' }, { status: 400 }),
      ),
    )

    renderDashboard()
    await waitFor(
      () => expect(screen.getAllByLabelText(/\d+ days available/i).length).toBeGreaterThan(0),
      { timeout: 5000 },
    )

    await userEvent.click(screen.getByRole('button', { name: /request time off for lahore/i }))
    await userEvent.type(screen.getByLabelText(/reason/i), 'Annual leave')

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /submit request/i }))
    })

    // After rejection, onError sets requestStatus to rolled-back
    await waitFor(
      () => {
        const status = useUIStore.getState().requestStatuses.get('Lahore')
        expect(status).toBe('rolled-back')
      },
      { timeout: 8000 },
    )

    // DOM should show error alert for the rolled-back Lahore card
    await waitFor(
      () => {
        const alerts = screen.queryAllByRole('alert')
        expect(alerts.length).toBeGreaterThan(0)
      },
      { timeout: 3000 },
    )
  })

  it('silent failure detection: onSettled detects mismatch and rolls back', async () => {
    // POST returns 201 but balance re-read stays at 10 (HCM lied)
    server.use(
      http.post('/api/hcm/request', () =>
        HttpResponse.json(
          {
            id: 'req_001',
            employeeId: 'emp_001',
            locationId: 'Lahore',
            days: 1,
            reason: 'test',
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
          { status: 201 },
        ),
      ),
      http.get('/api/hcm/balance', ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('locationId') === 'Lahore') {
          return HttpResponse.json({
            employeeId: 'emp_001',
            locationId: 'Lahore',
            balance: 10,
            lastUpdated: new Date().toISOString(),
          })
        }
        return HttpResponse.json({ error: 'not_found' }, { status: 404 })
      }),
    )

    renderDashboard()
    await waitFor(
      () => expect(screen.getAllByLabelText(/\d+ days available/i).length).toBeGreaterThan(0),
      { timeout: 5000 },
    )

    await userEvent.click(screen.getByRole('button', { name: /request time off for lahore/i }))
    await userEvent.type(screen.getByLabelText(/reason/i), 'Test')

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /submit request/i }))
    })

    // After silent failure detection in onSettled, status becomes rolled-back
    await waitFor(
      () => {
        const status = useUIStore.getState().requestStatuses.get('Lahore')
        expect(status).toBe('rolled-back')
      },
      { timeout: 10000 },
    )
  })

  it('work anniversary: notification appears after background balance update', async () => {
    let callCount = 0
    server.use(
      http.get('/api/hcm/balances', () => {
        callCount++
        const lahoreBalance = callCount === 1 ? 10 : 15
        return HttpResponse.json({
          employeeId: 'emp_001',
          balances: [
            { locationId: 'Lahore', balance: lahoreBalance, lastUpdated: new Date().toISOString() },
            { locationId: 'Karachi', balance: 8, lastUpdated: new Date().toISOString() },
            { locationId: 'Dubai', balance: 12, lastUpdated: new Date().toISOString() },
            { locationId: 'London', balance: 15, lastUpdated: new Date().toISOString() },
          ],
        })
      }),
    )

    const { qc } = renderDashboard()
    await waitFor(
      () => expect(screen.getAllByLabelText(/\d+ days available/i).length).toBeGreaterThan(0),
      { timeout: 5000 },
    )

    // Trigger the background refetch (simulates 30s interval)
    await act(async () => {
      await qc.refetchQueries({ queryKey: ['hcm', 'balances', 'emp_001'] })
    })

    // Notification should appear via showNotification in EmployeeDashboard's useEffect
    await waitFor(
      () => {
        const msg = useUIStore.getState().notificationMessage
        expect(msg).toBeTruthy()
      },
      { timeout: 5000 },
    )
  })

  it('background update held during in-flight request, then applied after settle', async () => {
    // We need to hold the POST so we can fire a background refetch mid-flight
    let resolvePost!: () => void
    server.use(
      http.post('/api/hcm/request', async () => {
        await new Promise<void>((r) => { resolvePost = r })
        return HttpResponse.json(
          { id: 'req_001', employeeId: 'emp_001', locationId: 'Lahore', days: 1, reason: 'Test', status: 'pending', createdAt: new Date().toISOString() },
          { status: 201 },
        )
      }),
      // After the POST resolves, the single-balance re-read returns the deducted value
      http.get('/api/hcm/balance', ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('locationId') === 'Lahore') {
          return HttpResponse.json({ employeeId: 'emp_001', locationId: 'Lahore', balance: 9, lastUpdated: new Date().toISOString() })
        }
        return HttpResponse.json({ error: 'not_found' }, { status: 404 })
      }),
    )

    let bgCallCount = 0
    server.use(
      http.get('/api/hcm/balances', () => {
        bgCallCount++
        // Second call (background refetch) returns a higher balance (anniversary bonus)
        const lahoreBalance = bgCallCount === 1 ? 10 : 13
        return HttpResponse.json({
          employeeId: 'emp_001',
          balances: [
            { locationId: 'Lahore', balance: lahoreBalance, lastUpdated: new Date().toISOString() },
            { locationId: 'Karachi', balance: 8, lastUpdated: new Date().toISOString() },
            { locationId: 'Dubai', balance: 12, lastUpdated: new Date().toISOString() },
            { locationId: 'London', balance: 15, lastUpdated: new Date().toISOString() },
          ],
        })
      }),
    )

    const { qc } = renderDashboard()
    await waitFor(
      () => expect(screen.getAllByLabelText(/\d+ days available/i).length).toBeGreaterThan(0),
      { timeout: 5000 },
    )

    // Start mutation — do NOT resolve it yet
    await userEvent.click(screen.getByRole('button', { name: /request time off for lahore/i }))
    await userEvent.type(screen.getByLabelText(/reason/i), 'Test')
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /submit request/i }))
    })

    // The request is now in-flight. Zustand flag should be set.
    await waitFor(() => {
      expect(useUIStore.getState().inFlightLocations.has('Lahore')).toBe(true)
    }, { timeout: 3000 })

    // Trigger background refetch WHILE request is in-flight
    await act(async () => {
      await qc.refetchQueries({ queryKey: ['hcm', 'balances', 'emp_001'] })
    })

    // Background update must be HELD — pendingBackgroundUpdates should have Lahore
    expect(useUIStore.getState().pendingBackgroundUpdates.has('Lahore')).toBe(true)

    // Now resolve the POST — mutation settles
    resolvePost()

    // After settle, in-flight flag clears and pending background update is applied
    await waitFor(() => {
      expect(useUIStore.getState().inFlightLocations.has('Lahore')).toBe(false)
    }, { timeout: 5000 })

    await waitFor(() => {
      expect(useUIStore.getState().pendingBackgroundUpdates.has('Lahore')).toBe(false)
    }, { timeout: 5000 })
  })

  it('per-location granularity: rollback on Lahore does not affect Karachi', async () => {
    server.use(
      http.post('/api/hcm/request', () =>
        HttpResponse.json({ error: 'insufficient_balance' }, { status: 400 }),
      ),
    )

    renderDashboard()
    await waitFor(
      () => expect(screen.getAllByLabelText(/\d+ days available/i).length).toBeGreaterThan(0),
      { timeout: 5000 },
    )

    // Karachi balance before submission
    const karachiBefore = screen.getByLabelText('8 days available')
    expect(karachiBefore).toBeInTheDocument()

    // Submit a request for Lahore that will be rejected
    await userEvent.click(screen.getByRole('button', { name: /request time off for lahore/i }))
    await userEvent.type(screen.getByLabelText(/reason/i), 'Annual leave')
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /submit request/i }))
    })

    // Wait for Lahore to roll back
    await waitFor(() => {
      const status = useUIStore.getState().requestStatuses.get('Lahore')
      expect(status).toBe('rolled-back')
    }, { timeout: 8000 })

    // Karachi must still show 8 days — unaffected by Lahore's rollback
    expect(screen.getByLabelText('8 days available')).toBeInTheDocument()

    // Karachi must have no error state
    expect(useUIStore.getState().requestStatuses.get('Karachi')).toBeUndefined()
  })
})
