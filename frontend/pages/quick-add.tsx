import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { enqueue } from '../utils/offlineQueue'

export default function QuickAdd() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    officeName: '',
    officeAddress: '',
    locality: '',
    contactName: '',
    contactDesignation: '',
    contactNumber: '',
    visitDate: new Date().toISOString().split('T')[0],
    status: 'FOLLOW_UP',
    priority: 'WARM',
    notes: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const payload = {
        officeName: formData.officeName,
        officeAddress: formData.officeAddress,
        locality: formData.locality,
        contactName: formData.contactName,
        contactDesignation: formData.contactDesignation,
        contactNumber: formData.contactNumber,
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes,
        visitDate: formData.visitDate || new Date().toISOString().split('T')[0],
      }

      const opts: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      }

      if (!navigator.onLine) {
        enqueue({ url: '/api/visits', options: opts })
        alert('Offline: Visit queued for upload')
        setFormData({
          officeName: '',
          officeAddress: '',
          locality: '',
          contactName: '',
          contactDesignation: '',
          contactNumber: '',
          visitDate: new Date().toISOString().split('T')[0],
          status: 'FOLLOW_UP',
          priority: 'WARM',
          notes: '',
        })
        return
      }

      const res = await fetch(`${apiBase}/api/visits`, opts)
      if (res.ok) {
        alert('Visit logged successfully')
        router.push('/dashboard')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to log visit')
      }
    } catch (err) {
      const fallbackOpts: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }
      enqueue({ url: '/api/visits', options: fallbackOpts })
      setError('Network error: Visit queued for retry')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Log Office Visit</h1>
          <p className="text-gray-600 mb-6">Quickly record your office visit details</p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Office Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="officeName" className="block text-sm font-medium text-gray-700 mb-1">Office Name *</label>
                  <input
                    id="officeName"
                    type="text"
                    value={formData.officeName}
                    onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                    placeholder="Company name"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="locality" className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
                  <input
                    id="locality"
                    type="text"
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    placeholder="Area or neighborhood"
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.officeAddress}
                    onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                    placeholder="Street address"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Person's name"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.contactDesignation}
                    onChange={(e) => setFormData({ ...formData, contactDesignation: e.target.value })}
                    placeholder="e.g., Owner, Manager"
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="Phone number"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Visit Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700 mb-1">Visit Date *</label>
                  <input
                    id="visitDate"
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="INTERESTED">Interested</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="NO_RESPONSE">No Response</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="HOT">🔥 Hot</option>
                    <option value="WARM">🌡️ Warm</option>
                    <option value="COLD">❄️ Cold</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Visit notes, pain points, product interest..."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging Visit...' : 'Log Visit'}
              </button>
              <Link href="/dashboard" className="flex-1 text-center btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
