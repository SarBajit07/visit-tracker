import { useEffect, useState } from 'react'
import { promptInstall, canPrompt } from '../utils/installPrompt'

export default function Header() {
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [queued, setQueued] = useState<number>(0)
  const [showInstall, setShowInstall] = useState<boolean>(false)

  useEffect(() => {
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

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white shadow">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
        <strong>Office Visit Tracker</strong>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">Queued: {queued}</div>
        {showInstall && (
          <button className="px-3 py-1 border rounded" onClick={() => promptInstall()}>
            Install
          </button>
        )}
      </div>
    </header>
  )
}
