import Link from 'next/link'

export default function Home() {
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Office Visit Tracker</h1>
      <div className="space-y-2">
        <Link href="/login"><a className="text-blue-600">Login</a></Link>
        <Link href="/quick-add"><a className="text-blue-600">Quick Add Visit</a></Link>
      </div>
    </div>
  )
}
