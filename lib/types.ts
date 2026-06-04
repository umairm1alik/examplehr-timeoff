export interface Employee {
  id: string
  name: string
}

export interface Balance {
  employeeId: string
  locationId: string
  balance: number
  lastUpdated: string
}

export interface BalancesResponse {
  employeeId: string
  balances: Array<{
    locationId: string
    balance: number
    lastUpdated: string
  }>
}

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'optimistic-pending'
  | 'rolled-back'

export interface TimeOffRequest {
  id: string
  employeeId: string
  locationId: string
  days: number
  reason: string
  status: RequestStatus
  createdAt: string
}

export interface SubmitRequestPayload {
  employeeId: string
  locationId: string
  days: number
  reason: string
}

export interface ApprovePayload {
  requestId: string
  action: 'approve' | 'deny'
  managerId: string
}

export interface AnniversaryPayload {
  employeeId: string
  locationId: string
  bonusDays: number
}

export type SimulateHeader = 'silent_failure' | 'rejection' | 'success'
