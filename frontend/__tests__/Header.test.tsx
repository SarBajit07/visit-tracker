import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

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
    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: true } as Response)
    const { default: Header } = await import('../components/Header')
    const { promptInstall } = require('../utils/installPrompt')

    render(<Header />)

    expect(await screen.findByText(/Queued: 2/)).toBeInTheDocument()
    const btn = await screen.findByRole('button', { name: /Install/i })
    fireEvent.click(btn)
    expect(promptInstall).toHaveBeenCalled()
    fetchMock.mockRestore()
  })

  test('checks authentication through the server instead of reading the HttpOnly cookie', async () => {
    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: true } as Response)
    const { default: Header } = await import('../components/Header')

    render(<Header />)

    await screen.findByText(/Queued: 2/)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/me',
      expect.objectContaining({ credentials: 'include' }),
    )
    fetchMock.mockRestore()
  })
})
