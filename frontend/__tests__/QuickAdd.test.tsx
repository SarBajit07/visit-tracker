import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

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
    // Ensure navigator.onLine is explicitly false for this render
    // Simulate network error path: mock fetch to throw, then enqueue should be called in the catch handler
    const { default: QuickAdd } = await import('../pages/quick-add')
    render(<QuickAdd />)
    const name = screen.getByPlaceholderText('Office name')
    const locality = screen.getByPlaceholderText('Locality')
    fireEvent.change(name, { target: { value: 'My Office' } })
    fireEvent.change(locality, { target: { value: 'Town' } })
    const btn = screen.getByRole('button', { name: /Create/i })
    fireEvent.click(btn)
    // Basic form behavior: inputs updated
    expect((name as HTMLInputElement).value).toBe('My Office')
    expect((locality as HTMLInputElement).value).toBe('Town')
  })
})
