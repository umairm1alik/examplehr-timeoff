import type { Employee, TimeOffRequest } from '@/lib/types'

// Module-level store persists across route handler calls within a server session.

const employees: Employee[] = [
  { id: 'emp_001', name: 'Ahmed Khan' },
  { id: 'emp_002', name: 'Sara Malik' },
  { id: 'emp_003', name: 'Bilal Raza' },
]

const locations = ['Lahore', 'Karachi', 'Dubai', 'London']

interface BalanceEntry {
  balance: number
  lastUpdated: string
}

// Pre-seeded balance values between 5 and 15
const SEED: Record<string, Record<string, number>> = {
  emp_001: { Lahore: 12, Karachi: 8,  Dubai: 10, London: 15 },
  emp_002: { Lahore: 7,  Karachi: 14, Dubai: 5,  London: 11 },
  emp_003: { Lahore: 9,  Karachi: 6,  Dubai: 13, London: 8  },
}

const balanceStore: Record<string, Record<string, BalanceEntry>> = {}

for (const [empId, locs] of Object.entries(SEED)) {
  balanceStore[empId] = {}
  for (const [loc, bal] of Object.entries(locs)) {
    balanceStore[empId][loc] = { balance: bal, lastUpdated: new Date().toISOString() }
  }
}

const requestStore: TimeOffRequest[] = []
let requestCounter = 1

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getEmployees(): Employee[] {
  return employees
}

export function getLocations(): string[] {
  return locations
}

export function getBalance(employeeId: string, locationId: string): BalanceEntry | null {
  return balanceStore[employeeId]?.[locationId] ?? null
}

export function getAllBalances(
  employeeId: string,
): Array<{ locationId: string; balance: number; lastUpdated: string }> {
  const entries = balanceStore[employeeId]
  if (!entries) return []
  return Object.entries(entries).map(([locationId, entry]) => ({
    locationId,
    balance: entry.balance,
    lastUpdated: entry.lastUpdated,
  }))
}

export function deductBalance(
  employeeId: string,
  locationId: string,
  days: number,
): boolean {
  const entry = balanceStore[employeeId]?.[locationId]
  if (!entry || entry.balance < days) return false
  entry.balance -= days
  entry.lastUpdated = new Date().toISOString()
  return true
}

export function addBalance(employeeId: string, locationId: string, days: number): void {
  const entry = balanceStore[employeeId]?.[locationId]
  if (!entry) return
  entry.balance += days
  entry.lastUpdated = new Date().toISOString()
}

export function createRequest(
  employeeId: string,
  locationId: string,
  days: number,
  reason: string,
): TimeOffRequest {
  const request: TimeOffRequest = {
    id: `req_${String(requestCounter++).padStart(3, '0')}`,
    employeeId,
    locationId,
    days,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  requestStore.push(request)
  return request
}

export function getRequests(status?: string): TimeOffRequest[] {
  if (!status || status === 'all') return requestStore
  return requestStore.filter((r) => r.status === status)
}

export function getRequest(requestId: string): TimeOffRequest | null {
  return requestStore.find((r) => r.id === requestId) ?? null
}

export function updateRequestStatus(
  requestId: string,
  status: TimeOffRequest['status'],
): TimeOffRequest | null {
  const req = requestStore.find((r) => r.id === requestId)
  if (!req) return null
  req.status = status
  return req
}

export function getEmployeeName(employeeId: string): string {
  return employees.find((e) => e.id === employeeId)?.name ?? employeeId
}
