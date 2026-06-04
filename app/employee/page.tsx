import { EmployeeDashboard } from '@/components/employee/EmployeeDashboard'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function EmployeePage(): JSX.Element {
  return (
    <ErrorBoundary>
      <EmployeeDashboard employeeId="emp_001" employeeName="Ahmed Khan" />
    </ErrorBoundary>
  )
}
