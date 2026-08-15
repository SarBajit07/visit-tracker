import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

    async function checkAuth() {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, { credentials: 'include' })
        setIsAuthenticated(res.ok)
      } catch {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Office Visit Tracker</h1>
            <p className="text-gray-600 mb-6">Track your field sales visits and manage follow-ups efficiently</p>
            <Link
              href="/login"
              className="block w-full text-center btn-primary mb-3"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Office Visit Tracker</h1>
          <p className="text-gray-600">Manage your field sales visits and follow-ups</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/dashboard"
            className="card p-6 hover:shadow-lg cursor-pointer group"
          >
            <div className="text-2xl mb-2">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition">Dashboard</h2>
            <p className="text-gray-600 text-sm mt-2">View your visits, analytics, and follow-ups</p>
          </Link>

          <Link
            href="/quick-add"
            className="card p-6 hover:shadow-lg cursor-pointer group"
          >
            <div className="text-2xl mb-2">⚡</div>
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition">Quick Add Visit</h2>
            <p className="text-gray-600 text-sm mt-2">Log a new office visit in seconds</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
