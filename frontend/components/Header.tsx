import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { promptInstall, canPrompt } from '../utils/installPrompt'

export default function Header() {
  const router = useRouter()
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [queued, setQueued] = useState(0)
  const [showInstall, setShowInstall] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const hasToken = document.cookie.includes('token=')
    setIsAuthenticated(hasToken)

    const update = () => {
      setOnline(navigator.onLine)
      const q = JSON.parse(localStorage.getItem('ovt_offline_queue') || '[]')
      setQueued(Array.isArray(q) ? q.length : 0)
    }
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    window.addEventListener('storage', update)
    setShowInstall(canPrompt())
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  async function logout() {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      await fetch(`${apiBase}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      setIsAuthenticated(false)
      router.push('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition">
            📍 Office Visit Tracker
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <div className="flex items-center gap-3 text-sm">
              {queued > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-800">
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Queued: {queued}
                </div>
              )}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                online
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-gray-50 border border-gray-200 text-gray-800'
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full ${
                  online ? 'bg-green-500' : 'bg-gray-400'
                }`}></span>
                {online ? 'Online' : 'Offline'}
              </div>
            </div>
          )}

          {showInstall && isAuthenticated && (
            <button
              onClick={() => promptInstall()}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
            >
              📥 Install App
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={logout}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
