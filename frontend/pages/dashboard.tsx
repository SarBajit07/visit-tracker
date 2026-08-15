import React, { useEffect, useState } from 'react'
import Link from 'next/link'

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
  const [offices, setOffices] = useState<Office[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedPriority, setSelectedPriority] = useState('ALL')
  const [activeSection, setActiveSection] = useState('Overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
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

  async function handleDeleteVisit(id: string) {
    const confirmed = window.confirm('Delete this office visit?')
    if (!confirmed) return

    try {
      const res = await fetch(`${apiBase}/api/visits/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Delete failed')
      }

      setVisits((current) => current.filter((visit) => visit.id !== id))
    } catch (err) {
      console.error('Failed to delete visit', err)
      alert('Could not delete visit. Please try again.')
    }
  }

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

  const filteredVisits = visits.filter((visit) => {
    const matchesStatus = selectedStatus === 'ALL' || visit.status === selectedStatus
    const matchesPriority = selectedPriority === 'ALL' || visit.priority === selectedPriority
    return matchesStatus && matchesPriority
  })

  const statusBreakdown = ['INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'REJECTED', 'NO_RESPONSE'].map(
    (status) => ({
      status,
      count: filteredVisits.filter((visit) => visit.status === status).length,
    }),
  )

  const priorityBreakdown = ['HOT', 'WARM', 'COLD'].map((priority) => ({
    priority,
    count: filteredVisits.filter((visit) => visit.priority === priority).length,
  }))

  const last7DaysTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().split('T')[0]
    const count = filteredVisits.filter((visit) => visit.visitDate.startsWith(key)).length

    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
    }
  })

  const bestDay = last7DaysTrend.reduce((best, day) => (day.count > best.count ? day : best), last7DaysTrend[0])
  const isDarkTheme = theme === 'dark'
  const navItems = ['Overview', 'Visits', 'Offices', 'Reports', 'Settings']
  const lastUpdated = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  const handleNavClick = (item: string) => {
    setActiveSection(item)
    setMobileNavOpen(false)

    const sectionMap: Record<string, string> = {
      Overview: 'overview-section',
      Visits: 'visits-section',
      Offices: 'offices-section',
      Reports: 'reports-section',
      Settings: 'settings-section',
    }

    const sectionId = sectionMap[item]
    if (!sectionId) return

    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-4 text-base font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${
        isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div className="mx-auto max-w-[1500px] lg:flex lg:items-start lg:gap-6">
        <aside
          className={`hidden w-72 shrink-0 rounded-2xl border p-4 shadow-sm lg:block ${
            isDarkTheme ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-base font-bold text-white">
              O
            </div>
            <div>
              <div className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                Office Flow
              </div>
              <div className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Workspace
              </div>
            </div>            feat: redesign dashboard with professional styling and responsive layout
          </div>

          <div className="space-y-2">
            {navItems.map((item, index) => {
              const isActive = activeSection === item

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? isDarkTheme
                        ? 'bg-slate-800 text-white'
                        : 'bg-blue-50 text-blue-700'
                      : isDarkTheme
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{item}</span>
                  <span className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>
                    {isActive ? '•' : '→'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className={`mt-8 rounded-2xl border p-4 ${isDarkTheme ? 'border-slate-800 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline</div>
            <div className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{filteredVisits.length}</div>
            <div className={`mt-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
              Active records in view
            </div>
          </div>
        </aside>

        <main className="flex-1">
          {mobileNavOpen && (
            <div className={`mb-4 rounded-2xl border p-3 lg:hidden ${isDarkTheme ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className={`rounded-xl px-3 py-2 text-left text-sm font-medium ${
                      activeSection === item
                        ? isDarkTheme
                          ? 'bg-slate-800 text-white'
                          : 'bg-blue-50 text-blue-700'
                        : isDarkTheme
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <header
            className={`sticky top-0 z-20 mb-6 rounded-2xl border p-4 shadow-sm backdrop-blur-sm sm:p-6 ${
              isDarkTheme ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white/90'
            }`}
          >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                  O
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                    Office Flow
                  </p>
                  <h1 className={`text-xl font-bold sm:text-2xl ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    Sales Dashboard
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <nav className={`hidden flex-wrap items-center gap-2 rounded-xl p-1 text-sm font-medium lg:flex ${isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  {navItems.slice(0, 3).map((item) => {
                    const isActive = activeSection === item

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleNavClick(item)}
                        className={`rounded-lg px-3 py-2 transition ${
                          isActive
                            ? isDarkTheme
                              ? 'bg-slate-700 text-white shadow-sm'
                              : 'bg-white text-blue-700 shadow-sm'
                            : isDarkTheme
                              ? 'hover:bg-slate-700 hover:text-white'
                              : 'hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                </nav>

                <button
                  type="button"
                  onClick={() => setMobileNavOpen((current) => !current)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition lg:hidden ${
                    isDarkTheme
                      ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Menu
                </button>

                <button
                  type="button"
                  onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    isDarkTheme
                      ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isDarkTheme ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isDarkTheme ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
                <span>Track office visits, follow-ups, and conversion momentum.</span>
                <span className={`ml-1 text-xs font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  Updated {lastUpdated}
                </span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className={`flex flex-wrap gap-2 rounded-xl border p-1 ${isDarkTheme ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                  {['ALL', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'REJECTED', 'NO_RESPONSE'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(status)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        selectedStatus === status
                          ? isDarkTheme
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'bg-white text-slate-900 shadow-sm'
                          : isDarkTheme
                            ? 'text-slate-300 hover:text-white'
                            : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                <div className={`flex flex-wrap gap-2 rounded-xl border p-1 ${isDarkTheme ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                  {['ALL', 'HOT', 'WARM', 'COLD'].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setSelectedPriority(priority)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        selectedPriority === priority
                          ? isDarkTheme
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'bg-white text-slate-900 shadow-sm'
                          : isDarkTheme
                            ? 'text-slate-300 hover:text-white'
                            : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {priority === 'ALL' ? 'All' : priority}
                    </button>
                  ))}
                </div>

                <button onClick={exportCSV} type="button" className={`btn-secondary w-full sm:w-auto ${isDarkTheme ? 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700' : ''}`}>
                  Export CSV
                </button>
                <Link href="/quick-add" className={`btn-primary w-full text-center sm:w-auto ${isDarkTheme ? 'shadow-lg shadow-blue-900/20' : ''}`}>
                  Log Visit
                </Link>
              </div>
            </div>
          </div>
          </header>

          <section id="overview-section" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Offices</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{stats.totalOffices}</p>
              </div>
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">🏢</div>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Visits</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{stats.totalVisits}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">📋</div>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
                <p className="mt-3 text-3xl font-bold text-emerald-600">{stats.conversionRate}%</p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">📈</div>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Follow-ups Today</p>
                <p className="mt-3 text-3xl font-bold text-sky-600">{stats.todayFollowups}</p>
              </div>
              <div className="rounded-xl bg-sky-100 p-3 text-sky-600">🔔</div>
            </div>
          </div>
          </section>

          <section id="reports-section" className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Pipeline Snapshot</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {filteredVisits.length} total
              </span>
            </div>

            <div className="space-y-4">
              {statusBreakdown.map(({ status, count }) => {
                const share = filteredVisits.length > 0 ? (count / filteredVisits.length) * 100 : 0

                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">{status.replace(/_/g, ' ')}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Priority Mix</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                Leads
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-3">
              {priorityBreakdown.map(({ priority, count }) => (
                <div key={priority} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className={`mx-auto mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityBadgeColor(priority)}`}>
                    {priority}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{count}</div>
                </div>
              ))}
            </div>
          </div>
          </section>
          <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Performance Trend</h2>
                <p className="mt-1 text-sm text-slate-500">Visits over the last 7 days</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {bestDay?.label || 'N/A'} peak
              </span>
            </div>

            <div className="flex h-44 items-end gap-3">
              {last7DaysTrend.map((day) => {
                const maxValue = Math.max(...last7DaysTrend.map((item) => item.count), 1)
                const height = `${Math.max((day.count / maxValue) * 100, day.count > 0 ? 18 : 8)}%`

                return (
                  <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-full w-full items-end justify-center rounded-t-2xl bg-slate-100 p-1">
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-indigo-400 shadow-sm"
                        style={{ height }}
                        title={`${day.label}: ${day.count} visits`}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{day.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Focus</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                Today
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Priority</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {priorityBreakdown.reduce((max, item) => (item.count > max.count ? item : max), priorityBreakdown[0] || { count: 0, priority: 'N/A' }).priority}
                </div>
                <div className="mt-1 text-sm text-slate-600">Highest active lead segment</div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Conversion</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{stats.conversionRate}%</div>
                <div className="mt-1 text-sm text-slate-600">Current conversion efficiency</div>
              </div>
            </div>
          </div>
        </section>
        <section id="visits-section" className="card mb-6 overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Recent Visits</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {visits.length} total
              </span>
            </div>
          </div>

          {filteredVisits.length === 0 ? (
            <div className="px-4 py-12 text-center sm:px-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                ✨
              </div>
              <p className="text-lg font-semibold text-slate-700">No matching visits found</p>
              <p className="mt-2 text-sm text-slate-500">Try adjusting the filters to view more records.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('ALL')
                  setSelectedPriority('ALL')
                }}
                className="btn-primary mt-5"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Office</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Contact</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Priority</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Notes</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredVisits.map((v) => (
                    <tr key={v.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">
                        {new Date(v.visitDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 sm:px-6">
                        {offices.find((o) => o.id === v.officeId)?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{v.contactName || 'N/A'}</td>
                      <td className="px-4 py-3 sm:px-6">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeColor(v.status)}`}
                        >
                          {v.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityBadgeColor(v.priority)}`}
                        >
                          {v.priority}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 text-sm text-slate-600 sm:px-6">
                        <span className="line-clamp-2">{v.notes || '—'}</span>
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <button
                          type="button"
                          onClick={() => handleDeleteVisit(v.id)}
                          className="text-sm font-medium text-red-600 transition hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </section>

          <section id="offices-section" className="card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Offices ({offices.length})</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              Active list
            </span>
          </div>

          {offices.length === 0 ? (
            <div className="py-10 text-center text-slate-500">No offices added yet</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {offices.map((o) => (
                <div key={o.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900">{o.name}</h3>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                      Office
                    </span>
                  </div>

                  {o.locality && (
                    <p className="mb-2 flex items-center gap-2 text-sm text-slate-600">
                      <span>📍</span>
                      <span>{o.locality}</span>
                    </p>
                  )}

                  {o.address && <p className="text-sm leading-6 text-slate-600">{o.address}</p>}

                  <div className="mt-4 border-t border-slate-200 pt-3 text-xs font-medium text-slate-500">
                    {visits.filter((v) => v.officeId === o.id).length} visit(s)
                  </div>
                </div>
              ))}
            </div>
          )}
          </section>
          <div id="settings-section" className="sr-only" aria-hidden="true" />
        </main>
      </div>
    </div>
  )
}
