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

const defaultCustomerForm = {
  name: '', phone: '', email: '', address: '', notes: ''
}

const inputClass = 'w-full rounded-md border border-border bg-[#1E293B] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600'

const Customers = () => {
  const { session, profile } = useAuth()
  const [customers, setCustomers]   = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState('')

  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState({ ...defaultCustomerForm })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)

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

  const openModal    = () => { setForm({ ...defaultCustomerForm }); setFormError(null); setShowModal(true) }
  const closeModal   = () => { setShowModal(false); setFormError(null) }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) { setFormError('Customer name is required.'); return }
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session!.access_token}`
        },
        body: JSON.stringify({
          business_id: profile!.business_id,
          name:        form.name.trim(),
          phone:       form.phone.trim()   || null,
          email:       form.email.trim()   || null,
          address:     form.address.trim() || null,
          notes:       form.notes.trim()   || null
        })
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        setFormError(data.error || 'Failed to add customer.')
        return
      }
      closeModal()
      fetchCustomers()
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
        <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white">
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

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-6 pb-6 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-[#0F172A] border border-border shadow-xl p-6 space-y-5 my-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Add Customer</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. John Smith"
                  className={inputClass} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Phone</label>
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
                <label className="text-sm font-medium text-foreground">Address</label>
                <input name="address" value={form.address} onChange={handleChange}
                  placeholder="e.g. 456 Oak Ave, Bryan TX"
                  className={inputClass} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Any notes about this customer..."
                  rows={2}
                  className={inputClass + ' resize-none'} />
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
                {submitting ? 'Adding...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
