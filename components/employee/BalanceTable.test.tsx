import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BalanceTable } from './BalanceTable'

function renderTable(
  balances: Array<{ locationId: string; balance: number; lastUpdated: string }>,
  isLoading = false,
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <BalanceTable employeeId="emp_001" balances={balances} isLoading={isLoading} />
    </QueryClientProvider>,
  )
}

describe('BalanceTable', () => {
  it('shows empty state message when balances array is empty', () => {
    renderTable([])
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/no balances found/i)).toBeInTheDocument()
  })

  it('renders a card for each balance entry', () => {
    const balances = [
      { locationId: 'Lahore', balance: 10, lastUpdated: new Date().toISOString() },
      { locationId: 'Karachi', balance: 8, lastUpdated: new Date().toISOString() },
    ]
    renderTable(balances)
    expect(screen.getByLabelText('Balance card for Lahore')).toBeInTheDocument()
    expect(screen.getByLabelText('Balance card for Karachi')).toBeInTheDocument()
  })

  it('shows skeleton loading cards when isLoading is true', () => {
    const { container } = renderTable([], true)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
