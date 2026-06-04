import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { ManagerDashboard } from '@/components/manager/ManagerDashboard'
import { resetMockStore } from '@/mocks/handlers'

const PENDING_REQUEST = {
  id: 'req_001',
  employeeId: 'emp_001',
  locationId: 'Lahore',
  days: 3,
  reason: 'Annual leave',
  status: 'pending',
  createdAt: new Date().toISOString(),
  employeeName: 'Ahmed Khan',
}

const server = setupServer(
  http.get('/api/hcm/requests', () => HttpResponse.json([PENDING_REQUEST])),
  http.get('/api/hcm/balance', () =>
    HttpResponse.json({ employeeId: 'emp_001', locationId: 'Lahore', balance: 12, lastUpdated: new Date().toISOString() }),
  ),
  http.post('/api/hcm/approve', () => HttpResponse.json({ ...PENDING_REQUEST, status: 'approved' })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => { server.resetHandlers(); resetMockStore() })
afterAll(() => server.close())

function renderManager() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchInterval: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ManagerDashboard />
    </QueryClientProvider>,
  )
}

describe('Integration: Manager flow', () => {
  it('shows approve button disabled while fresh balance loads, then enables it', async () => {
    let resolveBalance!: () => void
    server.use(
      http.get('/api/hcm/balance', async () => {
        await new Promise<void>((r) => { resolveBalance = r })
        return HttpResponse.json({ employeeId: 'emp_001', locationId: 'Lahore', balance: 12, lastUpdated: new Date().toISOString() })
      }),
    )

    renderManager()
    await waitFor(() => expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /view/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled())

    resolveBalance()

    await waitFor(() => expect(screen.getByRole('button', { name: /approve/i })).not.toBeDisabled(), { timeout: 3000 })
  })

  it('shows conflict error when approve returns 409', async () => {
    server.use(
      http.post('/api/hcm/approve', () =>
        HttpResponse.json({ error: 'insufficient_balance' }, { status: 409 }),
      ),
    )

    renderManager()
    await waitFor(() => expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /view/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /approve/i })).not.toBeDisabled(), { timeout: 3000 })
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('deny flow: clicking deny calls approve endpoint with deny action', async () => {
    let capturedBody: { action?: string } = {}
    server.use(
      http.post('/api/hcm/approve', async ({ request }) => {
        capturedBody = await request.json() as { action?: string }
        return HttpResponse.json({ ...PENDING_REQUEST, status: 'denied' })
      }),
    )

    renderManager()
    await waitFor(() => expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /view/i }))

    // Wait for fresh balance to load so buttons are enabled
    await waitFor(() => expect(screen.getByRole('button', { name: /deny/i })).not.toBeDisabled(), { timeout: 3000 })

    await userEvent.click(screen.getByRole('button', { name: /deny/i }))

    // The approve endpoint must have been called with action='deny'
    await waitFor(() => {
      expect(capturedBody.action).toBe('deny')
    }, { timeout: 3000 })
  })
})
