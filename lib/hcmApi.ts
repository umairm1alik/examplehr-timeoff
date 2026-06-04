import type {
  Balance,
  BalancesResponse,
  TimeOffRequest,
  SubmitRequestPayload,
  ApprovePayload,
  AnniversaryPayload,
  SimulateHeader,
} from './types'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
    const err = new Error(body.error ?? res.statusText) as Error & { status: number }
    err.status = res.status
    throw err
  }
  return res.json() as Promise<T>
}

export async function fetchBalance(employeeId: string, locationId: string): Promise<Balance> {
  const params = new URLSearchParams({ employeeId, locationId })
  const res = await fetch(`/api/hcm/balance?${params}`)
  return handleResponse<Balance>(res)
}

export async function fetchBalances(employeeId: string): Promise<BalancesResponse> {
  const params = new URLSearchParams({ employeeId })
  const res = await fetch(`/api/hcm/balances?${params}`)
  return handleResponse<BalancesResponse>(res)
}

export async function submitRequest(
  payload: SubmitRequestPayload,
  simulate?: SimulateHeader,
): Promise<TimeOffRequest> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (simulate) headers['X-HCM-Simulate'] = simulate
  const res = await fetch('/api/hcm/request', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  return handleResponse<TimeOffRequest>(res)
}

export async function approveRequest(payload: ApprovePayload): Promise<TimeOffRequest> {
  const res = await fetch('/api/hcm/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<TimeOffRequest>(res)
}

export async function fetchRequests(status = 'pending'): Promise<TimeOffRequest[]> {
  const params = new URLSearchParams({ status })
  const res = await fetch(`/api/hcm/requests?${params}`)
  return handleResponse<TimeOffRequest[]>(res)
}

export async function triggerAnniversary(payload: AnniversaryPayload): Promise<Balance> {
  const res = await fetch('/api/hcm/anniversary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<Balance>(res)
}
