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

const WORKER_ROLES = ['Technician', 'Lead Tech', 'Apprentice', 'Foreman', 'Driver', 'Other']

const defaultWorkerForm = {
  name: '', phone: '', email: '', role: 'Technician'
}

const inputClass = 'w-full rounded-md border border-border bg-[#1E293B] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600'

const Workers = () => {
  const { session, profile } = useAuth()
  const [workers, setWorkers]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState({ ...defaultWorkerForm })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)

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

  const openModal  = () => { setForm({ ...defaultWorkerForm }); setFormError(null); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setFormError(null) }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.name.trim())  { setFormError('Worker name is required.'); return }
    if (!form.phone.trim()) { setFormError('Phone number is required.'); return }
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session!.access_token}`
        },
        body: JSON.stringify({
          business_id: profile!.business_id,
          name:        form.name.trim(),
          phone:       form.phone.trim(),
          email:       form.email.trim() || null,
          role:        form.role
        })
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        setFormError(data.error || 'Failed to add worker.')
        return
      }
      closeModal()
      fetchWorkers()
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
        <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
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

      {/* Add Worker Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-6 pb-6 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-[#0F172A] border border-border shadow-xl p-6 space-y-5 my-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Add Worker</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. Mike Torres"
                  className={inputClass} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="e.g. 979-555-0123" type="tel"
                  className={inputClass} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input name="email" value={form.email} onChange={handleChange}
                  placeholder="optional" type="email"
                  className={inputClass} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Role</label>
                <select name="role" value={form.role} onChange={handleChange}
                  className={inputClass}>
                  {WORKER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {formError && <p className="text-sm text-red-400">{formError}</p>}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={closeModal} disabled={submitting}
                className="flex-1 rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50">
                {submitting ? 'Adding...' : 'Add Worker'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Workers
