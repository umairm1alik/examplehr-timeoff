import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BalanceCard } from './BalanceCard'
import { useUIStore } from '@/lib/store'

function renderCard(props: Partial<React.ComponentProps<typeof BalanceCard>> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <BalanceCard
        employeeId="emp_001"
        locationId="Lahore"
        balance={12}
        lastUpdated={new Date().toISOString()}
        {...props}
      />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useUIStore.setState({
    openForms: new Set(),
    inFlightLocations: new Set(),
    pendingBackgroundUpdates: new Map(),
    requestStatuses: new Map(),
    notificationMessage: null,
  })
})

describe('BalanceCard', () => {
  it('renders correct balance for given location', () => {
    renderCard()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Lahore')).toBeInTheDocument()
  })

  it('shows stale indicator when lastUpdated is older than 60 seconds', () => {
    const staleDate = new Date(Date.now() - 120_000).toISOString()
    renderCard({ lastUpdated: staleDate })
    expect(screen.getByLabelText('Stale data warning')).toBeInTheDocument()
  })

  it('does not show stale indicator for fresh data', () => {
    renderCard()
    expect(screen.queryByLabelText('Stale data warning')).not.toBeInTheDocument()
  })

  it('shows skeleton loading state when isLoading is true', () => {
    const { container } = renderCard({ isLoading: true, balance: 0 })
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
    expect(screen.queryByText('12')).not.toBeInTheDocument()
  })

  it('shows Request Time Off button when idle', () => {
    renderCard()
    expect(screen.getByRole('button', { name: /request time off/i })).toBeInTheDocument()
  })

  it('shows pending badge when request is in optimistic-pending state', () => {
    useUIStore.setState({
      requestStatuses: new Map([['Lahore', 'optimistic-pending']]),
    })
    renderCard()
    expect(screen.getByLabelText('Request pending')).toBeInTheDocument()
  })

  it('shows rollback error when request status is rolled-back', () => {
    useUIStore.setState({
      requestStatuses: new Map([['Lahore', 'rolled-back']]),
    })
    renderCard()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
