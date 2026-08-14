import { useState, FormEvent } from 'react'
import { enqueue } from '../utils/offlineQueue'

export default function QuickAdd() {
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    const payload = { name, locality }
    const opts = { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) }
    try {
      if (!navigator.onLine) {
        enqueue({ url: '/api/offices', options: opts })
        alert('Offline: queued for upload')
        return
      }
      const res = await fetch('/api/offices', opts)
      if (res.ok) alert('Office created')
      else alert('Failed')
    } catch (err) {
      enqueue({ url: '/api/offices', options: opts })
      alert('Network error: queued for retry')
    }
  }
  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Quick Add Office</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Office name" className="w-full p-2 border" />
        <input value={locality} onChange={e=>setLocality(e.target.value)} placeholder="Locality" className="w-full p-2 border" />
        <button className="bg-green-600 text-white px-4 py-2">Create</button>
      </form>
    </div>
  )
}
