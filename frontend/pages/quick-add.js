import { useState } from 'react'

export default function QuickAdd() {
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('');
  async function submit(e) {
    e.preventDefault();
    const res = await fetch('/api/offices', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name, locality }) });
    if (res.ok) alert('Office created');
    else alert('Failed');
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
