import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { ApprovalView } from './ApprovalView'

const server = setupServer(
  http.get('/api/hcm/balance', () =>
    HttpResponse.json({
      employeeId: 'emp_001',
      locationId: 'Lahore',
      balance: 12,
      lastUpdated: new Date().toISOString(),
    }),
  ),
  http.post('/api/hcm/approve', () => HttpResponse.json({ id: 'req_001', status: 'approved' })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockRequest = {
  id: 'req_001',
  employeeId: 'emp_001',
  locationId: 'Lahore',
  days: 3,
  reason: 'Annual leave',
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
  employeeName: 'Ahmed Khan',
}

function renderView() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ApprovalView request={mockRequest} onDone={vi.fn()} />
    </QueryClientProvider>,
  )
}

describe('ApprovalView', () => {
  it('keeps approve and deny buttons disabled while balance is loading', () => {
    renderView()
    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /deny/i })).toBeDisabled()
  })

  it('fetches fresh balance on mount and enables buttons after load', async () => {
    renderView()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /approve/i })).not.toBeDisabled()
    })
  })

  it('shows conflict error when approve returns 409', async () => {
    server.use(
      http.post('/api/hcm/approve', () =>
        HttpResponse.json({ error: 'insufficient_balance' }, { status: 409 }),
      ),
    )
    renderView()
    await waitFor(() => expect(screen.getByRole('button', { name: /approve/i })).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
