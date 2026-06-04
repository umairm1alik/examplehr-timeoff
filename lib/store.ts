import { create } from 'zustand'

interface PendingBackgroundUpdate {
  locationId: string
  balance: number
  lastUpdated: string
}

interface UIState {
  openForms: Set<string>
  inFlightLocations: Set<string>
  pendingBackgroundUpdates: Map<string, PendingBackgroundUpdate>
  requestStatuses: Map<string, 'optimistic-pending' | 'rolled-back' | 'confirmed' | null>
  notificationMessage: string | null

  openForm: (locationId: string) => void
  closeForm: (locationId: string) => void
  setInFlight: (locationId: string, inFlight: boolean) => void
  setRequestStatus: (
    locationId: string,
    status: 'optimistic-pending' | 'rolled-back' | 'confirmed' | null,
  ) => void
  holdBackgroundUpdate: (update: PendingBackgroundUpdate) => void
  getPendingBackgroundUpdate: (locationId: string) => PendingBackgroundUpdate | undefined
  clearPendingBackgroundUpdate: (locationId: string) => void
  showNotification: (message: string) => void
  clearNotification: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  openForms: new Set(),
  inFlightLocations: new Set(),
  pendingBackgroundUpdates: new Map(),
  requestStatuses: new Map(),
  notificationMessage: null,

  openForm: (locationId) =>
    set((state) => ({ openForms: new Set(Array.from(state.openForms).concat(locationId)) })),

  closeForm: (locationId) =>
    set((state) => {
      const next = new Set(state.openForms)
      next.delete(locationId)
      return { openForms: next }
    }),

  setInFlight: (locationId, inFlight) =>
    set((state) => {
      const next = new Set(state.inFlightLocations)
      inFlight ? next.add(locationId) : next.delete(locationId)
      return { inFlightLocations: next }
    }),

  setRequestStatus: (locationId, status) =>
    set((state) => {
      const next = new Map(state.requestStatuses)
      if (status === null) next.delete(locationId)
      else next.set(locationId, status)
      return { requestStatuses: next }
    }),

  holdBackgroundUpdate: (update) =>
    set((state) => {
      const next = new Map(state.pendingBackgroundUpdates)
      next.set(update.locationId, update)
      return { pendingBackgroundUpdates: next }
    }),

  getPendingBackgroundUpdate: (locationId) =>
    get().pendingBackgroundUpdates.get(locationId),

  clearPendingBackgroundUpdate: (locationId) =>
    set((state) => {
      const next = new Map(state.pendingBackgroundUpdates)
      next.delete(locationId)
      return { pendingBackgroundUpdates: next }
    }),

  showNotification: (message) => set({ notificationMessage: message }),
  clearNotification: () => set({ notificationMessage: null }),
}))
