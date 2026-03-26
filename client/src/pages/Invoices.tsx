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

const Invoices = () => {
  const { session, profile } = useAuth()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

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

  useEffect(() => {
    if (session?.access_token && profile?.business_id) {
      fetchInvoices()
    }
  }, [session?.access_token, profile?.business_id, fetchInvoices])

  const filtered = filter === 'all'
    ? invoices
    : invoices.filter(i => i.status === filter)

  const totalValue    = invoices.reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalPaid     = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount ?? 0), 0)

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
    </div>
  )
}

export default Invoices
