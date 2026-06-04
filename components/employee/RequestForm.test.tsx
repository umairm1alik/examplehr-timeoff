import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestForm } from './RequestForm'

const base = {
  balance: 10,
  locationId: 'Lahore',
  employeeId: 'emp_001',
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  isSubmitting: false,
}

describe('RequestForm', () => {
  it('enables submit when days are within balance and reason filled', async () => {
    render(<RequestForm {...base} />)
    await userEvent.type(screen.getByLabelText(/reason/i), 'Vacation')
    expect(screen.getByRole('button', { name: /submit request/i })).not.toBeDisabled()
  })

  it('disables submit when requested days exceed balance', async () => {
    render(<RequestForm {...base} balance={1} />)
    // Use fireEvent.change for date inputs — userEvent.type doesn't work reliably in jsdom
    const future = new Date()
    future.setDate(future.getDate() + 5)
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: future.toISOString().split('T')[0] },
    })
    await userEvent.type(screen.getByLabelText(/reason/i), 'Vacation')
    expect(screen.getByRole('button', { name: /submit request/i })).toBeDisabled()
  })

  it('calls onSubmit with correct payload on form submit', async () => {
    const onSubmit = vi.fn()
    render(<RequestForm {...base} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/reason/i), 'Annual leave')
    await userEvent.click(screen.getByRole('button', { name: /submit request/i }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'Annual leave', days: expect.any(Number) }),
    )
  })

  it('shows loading spinner when isSubmitting is true', () => {
    render(<RequestForm {...base} isSubmitting />)
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  })

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn()
    render(<RequestForm {...base} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
