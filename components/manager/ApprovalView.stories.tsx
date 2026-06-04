import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from '@storybook/test'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { ApprovalView } from './ApprovalView'

const mockRequest = {
  id: 'req_001',
  employeeId: 'emp_001',
  locationId: 'Lahore',
  days: 3,
  reason: 'Annual leave',
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
  employeeName: 'Ahmed Khan',
}

function withQC(Story: React.ComponentType): JSX.Element {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <Story />
    </QueryClientProvider>
  )
}

const meta: Meta<typeof ApprovalView> = {
  title: 'Manager/ApprovalView',
  component: ApprovalView,
  decorators: [(Story) => withQC(Story)],
  tags: ['autodocs'],
  args: {
    request: mockRequest,
    onDone: () => {},
  },
}
export default meta

type Story = StoryObj<typeof ApprovalView>

export const LoadingFreshBalance: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/balance', async () => {
          // Hold indefinitely so loading state stays visible
          await new Promise(() => {})
          return HttpResponse.json({})
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /approve/i })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: /deny/i })).toBeDisabled()
  },
}

export const ReadyToApprove: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/balance', () =>
          HttpResponse.json({
            employeeId: 'emp_001',
            locationId: 'Lahore',
            balance: 12,
            lastUpdated: new Date().toISOString(),
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Wait for balance to load
    await new Promise((r) => setTimeout(r, 600))
    await expect(canvas.getByRole('button', { name: /approve/i })).not.toBeDisabled()
  },
}

export const ConflictOnApprove: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/balance', () =>
          HttpResponse.json({
            employeeId: 'emp_001',
            locationId: 'Lahore',
            balance: 12,
            lastUpdated: new Date().toISOString(),
          }),
        ),
        http.post('/api/hcm/approve', () =>
          HttpResponse.json({ error: 'insufficient_balance' }, { status: 409 }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await new Promise((r) => setTimeout(r, 600))
    const approveBtn = canvas.getByRole('button', { name: /approve/i })
    await approveBtn.click()
    await new Promise((r) => setTimeout(r, 500))
    await expect(canvas.getByRole('alert')).toBeInTheDocument()
  },
}
