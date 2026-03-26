import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

const statusIcon = (status: string) => {
  if (status === 'active') return '🟢'
  if (status === 'busy') return '🟠'
  return '🔴'
}

const statusLabel = (status: string) => {
  if (status === 'active') return 'Active'
  if (status === 'busy') return 'On Job'
  return 'Inactive'
}

const initials = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const Workers = () => {
  const { session, profile } = useAuth()
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/workers/${profile!.business_id}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` }
      })
      const data = await res.json()
      setWorkers(Array.isArray(data) ? data : (data.data ?? []))
    } catch {
      setError('Failed to load workers')
    } finally {
      setLoading(false)
    }
  }, [profile?.business_id, session?.access_token])

  useEffect(() => {
    if (session?.access_token && profile?.business_id) {
      fetchWorkers()
    }
  }, [session?.access_token, profile?.business_id, fetchWorkers])

  const counts = {
    total:    workers.length,
    active:   workers.filter(w => w.status === 'active').length,
    inactive: workers.filter(w => w.status !== 'active' && w.status !== 'busy').length,
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Workers</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          + Add Worker
        </Button>
      </div>

      {/* Summary bar */}
      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {counts.total} total &nbsp;·&nbsp;
          {counts.active} active &nbsp;·&nbsp;
          {counts.inactive} inactive
        </p>
      )}

      {/* Worker grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchWorkers}>Retry</Button>
        </div>
      ) : workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-lg border bg-card gap-2">
          <p className="text-muted-foreground">No workers added yet.</p>
          <p className="text-sm text-muted-foreground">Add your first worker to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workers.map(w => (
            <div key={w.id} className="rounded-lg bg-[#1E293B] p-5 space-y-3">
              {/* Top row: avatar + name + role */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {initials(w.name || '?')}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{w.name}</p>
                  {w.role && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {w.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>{statusIcon(w.status)}</span>
                <span>{statusLabel(w.status)}</span>
              </div>

              {/* Phone */}
              {w.phone && (
                <p className="text-xs text-muted-foreground">{w.phone}</p>
              )}

              {/* Command number */}
              <p className="text-xs text-muted-foreground">
                Command number: (979) 202-0380
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Workers
