import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const initials = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const Customers = () => {
  const { session, profile } = useAuth()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/customers/${profile!.business_id}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` }
      })
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : (data.data ?? []))
    } catch {
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [profile?.business_id, session?.access_token])

  useEffect(() => {
    if (session?.access_token && profile?.business_id) {
      fetchCustomers()
    }
  }, [session?.access_token, profile?.business_id, fetchCustomers])

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          + Add Customer
        </Button>
      </div>

      {/* Search bar */}
      <Input
        type="text"
        placeholder="Search by name, phone, or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="bg-background border-border text-foreground"
      />

      {/* Summary bar */}
      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {customers.length} total customer{customers.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Customer list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchCustomers}>Retry</Button>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex items-center justify-center h-48 rounded-lg border bg-card">
            <p className="text-muted-foreground">No customers yet. Add your first customer.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 rounded-lg border bg-card">
            <p className="text-muted-foreground">No customers match your search.</p>
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="rounded-lg bg-[#1E293B] p-4 flex items-center gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {initials(c.name || '?')}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="font-semibold text-foreground truncate">{c.name}</p>
                {c.phone && (
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                )}
                {c.email && (
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                )}
                {c.address && (
                  <p className="text-xs text-muted-foreground truncate">{c.address}</p>
                )}
              </div>

              {/* Right side */}
              <div className="flex-shrink-0 text-right space-y-1">
                <p className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                  View Jobs →
                </p>
                {c.last_service_date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.last_service_date).toLocaleDateString([], {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Customers
