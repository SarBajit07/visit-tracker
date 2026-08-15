import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

type Office = {
  id: string
  name: string
  address?: string | null
  locality?: string | null
}

type Visit = {
  id: string
  officeId: string
  contactName: string
  status: string
  priority: string
  notes?: string | null
  createdAt: string
  visitDate: string
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function Dashboard() {
  const router = useRouter()

  const [offices, setOffices] = useState<Office[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalOffices: 0,
    conversionRate: 0,
    todayFollowups: 0,
  })

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [officesRes, visitsRes] = await Promise.all([
          fetch(`${apiBase}/api/offices`, { credentials: 'include' }),
          fetch(`${apiBase}/api/visits`, { credentials: 'include' }),
        ])

        if (!mounted) return

        const officesData = officesRes.ok ? await officesRes.json() : []
        const visitsData = visitsRes.ok ? await visitsRes.json() : []

        setOffices(officesData)
        setVisits(visitsData)

        const totalVisits = visitsData.length
        const totalOffices = officesData.length
        const converted = visitsData.filter((v: Visit) => v.status === 'CONVERTED').length
        const conversionRate = totalVisits > 0 ? ((converted / totalVisits) * 100).toFixed(1) : '0'
        const today = new Date().toISOString().split('T')[0]
        const todayFollowups = visitsData.filter(
          (v: Visit) => v.status === 'FOLLOW_UP' && v.visitDate <= today,
        ).length

        setStats({
          totalVisits,
          totalOffices,
          conversionRate: parseFloat(conversionRate),
          todayFollowups,
        })
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  function exportCSV() {
    const header = ['Visit Date', 'Office', 'Contact', 'Status', 'Priority', 'Notes']
    const rows = visits.map((v) => [
      new Date(v.visitDate).toLocaleDateString(),
      offices.find((o) => o.id === v.officeId)?.name || 'Unknown',
      v.contactName || 'N/A',
      v.status,
      v.priority,
      (v.notes || '').replace(/"/g, '""'),
    ])

    const csv = [header.join(',')]
      .concat(rows.map((r) => r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `visits_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      INTERESTED: 'bg-blue-100 text-blue-800',
      FOLLOW_UP: 'bg-yellow-100 text-yellow-800',
      CONVERTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      NO_RESPONSE: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadgeColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      HOT: 'bg-red-100 text-red-800',
      WARM: 'bg-orange-100 text-orange-800',
      COLD: 'bg-blue-100 text-blue-800',
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your office visits and follow-ups</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="btn-secondary">
              📊 Export CSV
            </button>
            <Link href="/quick-add" className="btn-primary">
              ➕ Log Visit
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="text-sm text-gray-600 mb-1">Total Offices</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalOffices}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600 mb-1">Total Visits</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalVisits}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
            <div className="text-3xl font-bold text-green-600">{stats.conversionRate}%</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600 mb-1">Follow-ups Today</div>
            <div className="text-3xl font-bold text-blue-600">{stats.todayFollowups}</div>
          </div>
        </div>

        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Visits</h2>
          {visits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No visits logged yet</p>
              <Link href="/quick-add" className="btn-primary inline-block">
                Log Your First Visit
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Office</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-sm">{new Date(v.visitDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {offices.find((o) => o.id === v.officeId)?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-sm">{v.contactName || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(v.status)}`}
                        >
                          {v.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(v.priority)}`}
                        >
                          {v.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-xs">{v.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Offices ({offices.length})</h2>
          {offices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No offices visited yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offices.map((o) => (
                <div key={o.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <h3 className="font-semibold text-gray-900 mb-1">{o.name}</h3>
                  {o.locality && <p className="text-sm text-gray-600 mb-1">📍 {o.locality}</p>}
                  {o.address && <p className="text-sm text-gray-600">{o.address}</p>}
                  <div className="mt-3 text-xs text-gray-500">
                    {visits.filter((v) => v.officeId === o.id).length} visit(s)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
