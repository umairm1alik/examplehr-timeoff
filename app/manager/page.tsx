import { ManagerDashboard } from '@/components/manager/ManagerDashboard'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function ManagerPage(): JSX.Element {
  return (
    <ErrorBoundary>
      <ManagerDashboard />
    </ErrorBoundary>
  )
}
