import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

type FilterType = 'all' | 'draft' | 'sent' | 'paid' | 'overdue'

const formatStatus = (status: string) =>
  ({ draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue' }[status] || status)

const statusColor = (status: string) =>
  ({ draft: 'bg-gray-500', sent: 'bg-blue-500', paid: 'bg-green-500', overdue: 'bg-red-500' }[status] || 'bg-gray-500')

const statusBorder = (status: string) =>
  ({ draft: 'border-l-gray-500', sent: 'border-l-blue-500', paid: 'border-l-green-500', overdue: 'border-l-red-500' }[status] || 'border-l-gray-500')

const formatCurrency = (amount: number) =>
  '$' + (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All',     value: 'all' },
  { label: 'Draft',   value: 'draft' },
  { label: 'Sent',    value: 'sent' },
  { label: 'Paid',    value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
]

const INVOICE_STATUSES = ['draft', 'sent', 'paid']

const defaultInvoiceForm = {
  customer_id: '',
  amount: '',
  description: '',
  status: 'draft'
}

const inputClass = 'w-full rounded-md border border-border bg-[#1E293B] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600'

const Invoices = () => {
  const { session, profile } = useAuth()
  const [invoices, setInvoices]     = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [filter, setFilter]         = useState<FilterType>('all')

  const [customers, setCustomers]   = useState<any[]>([])
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState({ ...defaultInvoiceForm })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/invoices/${profile!.business_id}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` }
      })
      const data = await res.json()
      setInvoices(Array.isArray(data) ? data : (data.data ?? []))
    } catch {
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [profile?.business_id, session?.access_token])

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${profile!.business_id}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` }
      })
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : (data.data ?? []))
    } catch {}
  }, [profile?.business_id, session?.access_token])

  useEffect(() => {
    if (session?.access_token && profile?.business_id) {
      fetchInvoices()
      fetchCustomers()
    }
  }, [session?.access_token, profile?.business_id, fetchInvoices, fetchCustomers])

  const openModal    = () => { setForm({ ...defaultInvoiceForm }); setFormError(null); setShowModal(true) }
  const closeModal   = () => { setShowModal(false); setFormError(null) }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.customer_id) { setFormError('Please select a customer.'); return }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setFormError('Please enter a valid amount.'); return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session!.access_token}`
        },
        body: JSON.stringify({
          business_id:  profile!.business_id,
          customer_id:  form.customer_id,
          amount:       parseFloat(form.amount),
          description:  form.description.trim() || null,
          status:       form.status
        })
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        setFormError(data.error || 'Failed to create invoice.')
        return
      }
      closeModal()
      fetchInvoices()
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = filter === 'all'
    ? invoices
    : invoices.filter(i => i.status === filter)

  const totalValue       = invoices.reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalPaid        = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount ?? 0), 0)

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
        <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white">
          + New Invoice
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-[#1E293B] text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {invoices.length} total &nbsp;·&nbsp;
          {formatCurrency(totalValue)} total value &nbsp;·&nbsp;
          {formatCurrency(totalPaid)} paid &nbsp;·&nbsp;
          {formatCurrency(totalOutstanding)} outstanding
        </p>
      )}

      {/* Invoice list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchInvoices}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 rounded-lg border bg-card">
            <p className="text-muted-foreground">
              {invoices.length === 0 ? 'No invoices yet.' : 'No invoices match this filter.'}
            </p>
          </div>
        ) : (
          filtered.map(inv => (
            <div
              key={inv.id}
              className={`rounded-lg border-l-4 bg-[#1E293B] p-4 flex items-start justify-between gap-4 ${statusBorder(inv.status)}`}
            >
              {/* Left */}
              <div className="space-y-0.5 min-w-0">
                {(inv.invoice_number || inv.id) && (
                  <p className="text-xs text-muted-foreground">
                    #{inv.invoice_number || inv.id.slice(0, 8)}
                  </p>
                )}
                <p className="font-semibold text-foreground truncate">
                  {inv.customer_name || 'Unknown Customer'}
                </p>
                {inv.job_title && (
                  <p className="text-xs text-muted-foreground truncate">{inv.job_title}</p>
                )}
                {inv.description && (
                  <p className="text-xs text-muted-foreground truncate">{inv.description}</p>
                )}
                {inv.due_date && (
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(inv.due_date).toLocaleDateString([], {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Right */}
              <div className="flex-shrink-0 text-right space-y-1">
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(inv.amount)}
                </p>
                <span className={`text-xs px-2 py-1 rounded-full text-white ${statusColor(inv.status)}`}>
                  {formatStatus(inv.status)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-6 pb-6 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-[#0F172A] border border-border shadow-xl p-6 space-y-5 my-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">New Invoice</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Customer <span className="text-red-400">*</span>
                </label>
                <select name="customer_id" value={form.customer_id} onChange={handleChange}
                  className={inputClass}>
                  <option value="">— Select customer —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Amount ($) <span className="text-red-400">*</span>
                </label>
                <input name="amount" value={form.amount} onChange={handleChange}
                  placeholder="e.g. 350.00" type="number" min="0" step="0.01"
                  className={inputClass} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="e.g. AC repair — replaced capacitor and contactor"
                  rows={3}
                  className={inputClass + ' resize-none'} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select name="status" value={form.status} onChange={handleChange}
                  className={inputClass}>
                  {INVOICE_STATUSES.map(s => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
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
                {submitting ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Invoices
