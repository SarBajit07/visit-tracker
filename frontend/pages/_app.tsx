import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { processQueue } from '../utils/offlineQueue'
import Header from '../components/Header'
import { initInstallPromptListener } from '../utils/installPrompt'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const onOnline = () => { processQueue() }
    window.addEventListener('online', onOnline)
    // attempt to process any queued items at startup
    processQueue()
    initInstallPromptListener()
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  )
}
