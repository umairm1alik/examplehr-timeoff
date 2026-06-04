import { BalanceCard } from './BalanceCard'

interface BalanceTableProps {
  employeeId: string
  balances: Array<{ locationId: string; balance: number; lastUpdated: string }>
  isLoading: boolean
}

const SKELETON_LOCATIONS = ['Lahore', 'Karachi', 'Dubai', 'London']

export function BalanceTable({ employeeId, balances, isLoading }: BalanceTableProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading balances">
        {SKELETON_LOCATIONS.map((loc) => (
          <BalanceCard
            key={loc}
            employeeId={employeeId}
            locationId={loc}
            balance={0}
            lastUpdated={new Date().toISOString()}
            isLoading
          />
        ))}
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8" role="status">
        No balances found for this employee.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {balances.map((b) => (
        <BalanceCard
          key={b.locationId}
          employeeId={employeeId}
          locationId={b.locationId}
          balance={b.balance}
          lastUpdated={b.lastUpdated}
        />
      ))}
    </div>
  )
}
