import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../utils/installPrompt', () => ({
  canPrompt: jest.fn(() => true),
  promptInstall: jest.fn(),
}))

describe('Header', () => {
  beforeEach(() => {
    // mock online and localStorage queue
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true })
    localStorage.setItem('ovt_offline_queue', JSON.stringify([1, 2]))
  })

  afterEach(() => {
    localStorage.clear()
    jest.resetAllMocks()
  })

  test('shows queued count and install button calls prompt', async () => {
    const { default: Header } = await import('../components/Header')
    const { promptInstall } = require('../utils/installPrompt')
    render(<Header />)
    expect(screen.getByText(/Queued: 2/)).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: /Install/i })
    fireEvent.click(btn)
    expect(promptInstall).toHaveBeenCalled()
  })
})
