import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from '@storybook/test'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BalanceCard } from './BalanceCard'
import { useUIStore } from '@/lib/store'

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function withQC(Story: React.ComponentType): JSX.Element {
  return (
    <QueryClientProvider client={makeQC()}>
      <Story />
    </QueryClientProvider>
  )
}

const now = new Date().toISOString()
const staleTs = new Date(Date.now() - 120_000).toISOString()

const meta: Meta<typeof BalanceCard> = {
  title: 'Employee/BalanceCard',
  component: BalanceCard,
  decorators: [(Story) => withQC(Story)],
  tags: ['autodocs'],
  args: {
    employeeId: 'emp_001',
    locationId: 'Lahore',
    balance: 12,
    lastUpdated: now,
  },
}
export default meta

type Story = StoryObj<typeof BalanceCard>

export const Loading: Story = {
  args: { isLoading: true, balance: 0 },
  play: async ({ canvasElement }) => {
    const skeletons = canvasElement.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  },
}

export const Idle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('12')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /request time off/i })).toBeInTheDocument()
  },
}

export const Stale: Story = {
  args: { lastUpdated: staleTs },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Stale data warning')).toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { balance: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('0')).toBeInTheDocument()
  },
}

export const OptimisticPending: Story = {
  args: { balance: 8 },
  decorators: [
    (Story) => {
      useUIStore.setState(() => ({
        requestStatuses: new Map([['Lahore', 'optimistic-pending' as const]]),
      }))
      return withQC(Story)
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Request pending')).toBeInTheDocument()
    await expect(canvas.getByText('8')).toBeInTheDocument()
  },
}

export const OptimisticRolledBack: Story = {
  decorators: [
    (Story) => {
      useUIStore.setState(() => ({
        requestStatuses: new Map([['Lahore', 'rolled-back' as const]]),
      }))
      return withQC(Story)
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toBeInTheDocument()
    await expect(canvas.getByText('12')).toBeInTheDocument()
  },
}

export const HCMRejected: Story = {
  decorators: [
    (Story) => {
      useUIStore.setState(() => ({
        requestStatuses: new Map([['Lahore', 'rolled-back' as const]]),
      }))
      return withQC(Story)
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toBeInTheDocument()
  },
}

export const HCMSilentlyWrong: Story = {
  decorators: [
    (Story) => {
      useUIStore.setState(() => ({
        requestStatuses: new Map([['Lahore', 'rolled-back' as const]]),
        notificationMessage:
          'Balance update silently failed for Lahore. Your balance was not changed.',
      }))
      return withQC(Story)
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toBeInTheDocument()
  },
}

export const BalanceRefreshedMidSession: Story = {
  args: { balance: 15 },
  decorators: [
    (Story) => {
      useUIStore.setState(() => ({
        notificationMessage: 'Your balances were updated.',
      }))
      return withQC(Story)
    },
  ],
  play: async ({ canvasElement }) => {
    // NotificationBanner is outside BalanceCard, so check the page-level alert
    const alert = document.querySelector('[role="alert"]')
    expect(alert).not.toBeNull()
  },
}
