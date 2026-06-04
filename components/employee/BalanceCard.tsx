'use client'

import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StaleIndicator } from '@/components/ui/stale-indicator'
import { RequestForm } from './RequestForm'
import { useUIStore } from '@/lib/store'
import { submitRequest, fetchBalance } from '@/lib/hcmApi'
import type { Balance, BalancesResponse, SubmitRequestPayload } from '@/lib/types'

export interface BalanceCardProps {
  employeeId: string
  locationId: string
  balance: number
  lastUpdated: string
  isLoading?: boolean
}

export function BalanceCard({
  employeeId,
  locationId,
  balance,
  lastUpdated,
  isLoading = false,
}: BalanceCardProps): JSX.Element {
  const queryClient = useQueryClient()

  const openForms = useUIStore((s) => s.openForms)
  const requestStatuses = useUIStore((s) => s.requestStatuses)
  const openForm = useUIStore((s) => s.openForm)
  const closeForm = useUIStore((s) => s.closeForm)
  const setInFlight = useUIStore((s) => s.setInFlight)
  const setRequestStatus = useUIStore((s) => s.setRequestStatus)
  const getPendingBg = useUIStore((s) => s.getPendingBackgroundUpdate)
  const clearPendingBg = useUIStore((s) => s.clearPendingBackgroundUpdate)
  const showNotification = useUIStore((s) => s.showNotification)

  const isFormOpen = openForms.has(locationId)
  const requestStatus = requestStatuses.get(locationId)

  const singleKey = ['hcm', 'balance', employeeId, locationId]
  const allKey = ['hcm', 'balances', employeeId]

  const mutation = useMutation({
    mutationFn: (payload: SubmitRequestPayload) => submitRequest(payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: singleKey })
      await queryClient.cancelQueries({ queryKey: allKey })

      const previousSingle = queryClient.getQueryData<Balance>(singleKey)
      const previousAll = queryClient.getQueryData<BalancesResponse>(allKey)
      const expectedBalance = balance - payload.days

      queryClient.setQueryData<Balance>(singleKey, (old) =>
        old ? { ...old, balance: expectedBalance } : old,
      )
      queryClient.setQueryData<BalancesResponse>(allKey, (old) => {
        if (!old) return old
        return {
          ...old,
          balances: old.balances.map((b) =>
            b.locationId === locationId ? { ...b, balance: expectedBalance } : b,
          ),
        }
      })

      setInFlight(locationId, true)
      setRequestStatus(locationId, 'optimistic-pending')
      closeForm(locationId)

      return { previousSingle, previousAll, expectedBalance }
    },

    onError: (_err, _payload, context) => {
      if (context?.previousSingle) queryClient.setQueryData(singleKey, context.previousSingle)
      if (context?.previousAll) queryClient.setQueryData(allKey, context.previousAll)
      setRequestStatus(locationId, 'rolled-back')
    },

    onSettled: async (_data, err, _payload, context) => {
      setInFlight(locationId, false)

      // Always re-read the authoritative balance after mutation settles
      const fresh = await fetchBalance(employeeId, locationId).catch(() => null)

      if (fresh) {
        // Silent failure detection: HCM responded OK but balance did not change
        if (!err && context && fresh.balance !== context.expectedBalance) {
          if (context.previousSingle) queryClient.setQueryData(singleKey, context.previousSingle)
          if (context.previousAll) queryClient.setQueryData(allKey, context.previousAll)
          setRequestStatus(locationId, 'rolled-back')
          showNotification(
            `Balance update silently failed for ${locationId}. Your balance was not changed.`,
          )
        } else if (!err) {
          queryClient.setQueryData(singleKey, fresh)
          setRequestStatus(locationId, 'confirmed')
        }
      }

      // Apply any background update that was held while this request was in-flight
      const pendingBg = getPendingBg(locationId)
      if (pendingBg) {
        queryClient.setQueryData<Balance>(singleKey, (old) =>
          old ? { ...old, balance: pendingBg.balance, lastUpdated: pendingBg.lastUpdated } : old,
        )
        queryClient.setQueryData<BalancesResponse>(allKey, (old) => {
          if (!old) return old
          return {
            ...old,
            balances: old.balances.map((b) =>
              b.locationId === locationId
                ? { ...b, balance: pendingBg.balance, lastUpdated: pendingBg.lastUpdated }
                : b,
            ),
          }
        })
        clearPendingBg(locationId)
        showNotification('Your balances were updated with new data.')
      }
    },
  })

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm" aria-busy="true" aria-label={`Loading ${locationId} balance`}>
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-3" />
        <Skeleton className="h-9 w-36" />
      </div>
    )
  }

  const errorMessage = mutation.error instanceof Error ? mutation.error.message : null
  const isSilentFailure = requestStatus === 'rolled-back' && !errorMessage

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm" aria-label={`Balance card for ${locationId}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{locationId}</h3>
        <div className="flex gap-2 items-center">
          <StaleIndicator lastUpdated={lastUpdated} />
          {requestStatus === 'optimistic-pending' && (
            <Badge className="bg-blue-100 text-blue-800 border-transparent" aria-label="Request pending">
              Pending
            </Badge>
          )}
          {requestStatus === 'confirmed' && (
            <Badge className="bg-green-100 text-green-800 border-transparent" aria-label="Request confirmed">
              Confirmed
            </Badge>
          )}
        </div>
      </div>

      <p className="text-2xl font-bold text-gray-900 mb-1" aria-label={`${balance} days available`}>
        {balance} <span className="text-sm font-normal text-gray-500">days</span>
      </p>

      {requestStatus === 'rolled-back' && (
        <div role="alert" className="mt-2 rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {isSilentFailure
            ? 'Balance update silently failed. The HCM system did not apply the change.'
            : `Request failed: ${errorMessage ?? 'Unknown error'}`}
        </div>
      )}

      {!isFormOpen && requestStatus !== 'optimistic-pending' && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => { setRequestStatus(locationId, null); openForm(locationId) }}
          aria-label={`Request time off for ${locationId}`}
        >
          Request Time Off
        </Button>
      )}

      {isFormOpen && (
        <RequestForm
          balance={balance}
          locationId={locationId}
          employeeId={employeeId}
          isSubmitting={mutation.isPending}
          onCancel={() => closeForm(locationId)}
          onSubmit={({ days, reason }) => mutation.mutate({ employeeId, locationId, days, reason })}
        />
      )}
    </div>
  )
}
