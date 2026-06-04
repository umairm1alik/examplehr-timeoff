import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, within, userEvent } from '@storybook/test'
import { RequestForm } from './RequestForm'

const meta: Meta<typeof RequestForm> = {
  title: 'Employee/RequestForm',
  component: RequestForm,
  tags: ['autodocs'],
  args: {
    employeeId: 'emp_001',
    locationId: 'Lahore',
    balance: 10,
    isSubmitting: false,
    onSubmit: () => {},
    onCancel: () => {},
  },
}
export default meta

type Story = StoryObj<typeof RequestForm>

export const Idle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText(/reason/i), 'Vacation')
    await expect(canvas.getByRole('button', { name: /submit request/i })).not.toBeDisabled()
  },
}

export const InsufficientBalance: Story = {
  args: { balance: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const endInput = canvas.getByLabelText(/end date/i)
    const future = new Date()
    future.setDate(future.getDate() + 5)
    await userEvent.clear(endInput)
    await userEvent.type(endInput, future.toISOString().split('T')[0]!)
    await userEvent.type(canvas.getByLabelText(/reason/i), 'Vacation')
    await expect(canvas.getByRole('button', { name: /submit request/i })).toBeDisabled()
  },
}

export const Submitting: Story = {
  args: { isSubmitting: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  },
}

export const Confirmed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText(/reason/i), 'Annual leave')
    await expect(canvas.getByRole('button', { name: /submit request/i })).not.toBeDisabled()
  },
}

export const RolledBack: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  },
}
