type QueueItem = {
  url: string
  options: RequestInit
}

const QUEUE_KEY = 'ovt_offline_queue'

export function enqueue(item: QueueItem) {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as QueueItem[]
  q.push(item)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
}

export async function processQueue() {
  if (!navigator.onLine) return
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as QueueItem[]
  if (!q.length) return
  const remaining: QueueItem[] = []
  for (const item of q) {
    try {
      await fetch(item.url, item.options)
    } catch (e) {
      remaining.push(item)
    }
  }
  if (remaining.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  else localStorage.removeItem(QUEUE_KEY)
}

export function clearQueue() { localStorage.removeItem(QUEUE_KEY) }

export default {
  enqueue,
  processQueue,
  clearQueue,
}
