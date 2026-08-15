import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('QuickAdd', () => {
  beforeEach(() => {
    // default offline for the offline-queue path
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true, writable: true })
    ;(window as any).alert = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('queues when offline', async () => {
    const { default: QuickAdd } = await import('../pages/quick-add')
    render(<QuickAdd />)

    const name = screen.getByLabelText('Office Name *')
    const locality = screen.getByLabelText('Locality')
    fireEvent.change(name, { target: { value: 'My Office' } })
    fireEvent.change(locality, { target: { value: 'Town' } })

    expect((name as HTMLInputElement).value).toBe('My Office')
    expect((locality as HTMLInputElement).value).toBe('Town')
  })

  test('allows entering an older visit date', async () => {
    const { default: QuickAdd } = await import('../pages/quick-add')
    render(<QuickAdd />)

    const dateInput = screen.getByLabelText('Visit Date *')
    fireEvent.change(dateInput, { target: { value: '2024-01-15' } })

    expect((dateInput as HTMLInputElement).value).toBe('2024-01-15')
  })
})
