import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

type FilterType = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'invoiced'

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    scheduled:   'Scheduled',
    in_progress: 'In Progress',
    completed:   'Completed',
    invoiced:    'Invoiced',
    cancelled:   'Cancelled',
  }
  return map[status] || status
}

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    scheduled:   'bg-blue-500',
    in_progress: 'bg-amber-500',
    completed:   'bg-green-500',
    invoiced:    'bg-purple-500',
    cancelled:   'bg-red-500',
  }
  return map[status] || 'bg-gray-500'
}

const statusBorder = (status: string) => {
  const map: Record<string, string> = {
    scheduled:   'border-l-blue-500',
    in_progress: 'border-l-amber-500',
    completed:   'border-l-green-500',
    invoiced:    'border-l-purple-500',
    cancelled:   'border-l-red-500',
  }
  return map[status] || 'border-l-gray-500'
}

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All',         value: 'all' },
  { label: 'Scheduled',   value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed',   value: 'completed' },
  { label: 'Invoiced',    value: 'invoiced' },
]

const JOB_TYPES = ['Repair', 'Install', 'New System', 'Maintenance', 'Inspection', 'Other']

const defaultForm = {
  title: '', job_type: 'Repair', scheduled_at: '',
  address: '', notes: '', worker_id: '', customer_id: ''
}

const inputClass = 'w-full rounded-md bg-[#1E293B] border border-border text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-muted-foreground'

const Jobs = () => {
  const { session, profile } = useAuth()
  const [jobs, setJobs]           = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [filter, setFilter]       = useState<FilterType>('all')

  const [workers, setWorkers]       = useState<any[]>([])
  const [customers, setCustomers]   = useState<any[]>([])
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState({ ...defaultForm })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/jobs/${profile!.business_id}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` }
      })
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : (data.data ?? []))
    } catch {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [profile?.business_id, session?.access_token])

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch(`/api/workers/${profile!.business_id}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` }
      })
      const data = await res.json()
      setWorkers(Array.isArray(data) ? data : (data.data ?? []))
    } catch {}
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
      fetchJobs()
      fetchWorkers()
      fetchCustomers()
    }
  }, [session?.access_token, profile?.business_id, fetchJobs, fetchWorkers, fetchCustomers])

  const openModal = () => {
    setForm({ ...defaultForm })
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormError(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.title.trim())       return setFormError('Job title is required.')
    if (!form.scheduled_at)       return setFormError('Scheduled date & time is required.')
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session!.access_token}`
        },
        body: JSON.stringify({
          business_id:  profile!.business_id,
          title:        form.title.trim(),
          job_type:     form.job_type,
          scheduled_at: form.scheduled_at,
          address:      form.address.trim(),
          notes:        form.notes.trim(),
          worker_id:    form.worker_id   || null,
          customer_id:  form.customer_id || null,
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setFormError(data.error || 'Failed to create job.')
      } else {
        closeModal()
        fetchJobs()
      }
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredJobs = filter === 'all'
    ? jobs
    : jobs.filter(j => j.status === filter)

  const counts = {
    total:       jobs.length,
    scheduled:   jobs.filter(j => j.status === 'scheduled').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed:   jobs.filter(j => j.status === 'completed').length,
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
        <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          + New Job
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
          {counts.total} total &nbsp;·&nbsp;
          {counts.scheduled} scheduled &nbsp;·&nbsp;
          {counts.in_progress} in progress &nbsp;·&nbsp;
          {counts.completed} completed
        </p>
      )}

      {/* Job list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchJobs}>Retry</Button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex items-center justify-center h-48 rounded-lg border bg-card">
            <p className="text-muted-foreground">No jobs found</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div
              key={job.id}
              className={`rounded-lg border-l-4 bg-[#1E293B] p-4 flex items-start justify-between gap-4 ${statusBorder(job.status)}`}
            >
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{job.title}</p>
                {job.customer_name && (
                  <p className="text-xs text-muted-foreground">{job.customer_name}</p>
                )}
                {job.address && (
                  <p className="text-xs text-muted-foreground">{job.address}</p>
                )}
                {job.scheduled_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(job.scheduled_at).toLocaleString([], {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              <span className={`shrink-0 text-xs px-2 py-1 rounded-full text-white ${statusColor(job.status)}`}>
                {formatStatus(job.status)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Create Job Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-6 pb-6 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="w-full max-w-md rounded-xl bg-[#0F172A] border border-border shadow-xl p-6 space-y-5 my-auto">
            <h2 className="text-lg font-bold text-foreground">Create New Job</h2>

            {/* Job Title */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Job Title <span className="text-red-400">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. AC Repair"
                className={inputClass}
              />
            </div>

            {/* Job Type */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Job Type</label>
              <select name="job_type" value={form.job_type} onChange={handleChange} className={inputClass}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Scheduled Date & Time */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Scheduled Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduled_at"
                value={form.scheduled_at}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Assign Worker */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Assign Worker</label>
              <select name="worker_id" value={form.worker_id} onChange={handleChange} className={inputClass}>
                <option value="">— Unassigned —</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            {/* Customer */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Customer</label>
              <select name="customer_id" value={form.customer_id} onChange={handleChange} className={inputClass}>
                <option value="">— No customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Job Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123 Main St"
                className={inputClass}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Optional notes..."
                className={inputClass + ' resize-none'}
              />
            </div>

            {/* Error */}
            {formError && (
              <p className="text-sm text-red-400">{formError}</p>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={submitting}
                className="border-border text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submitting ? 'Creating...' : 'Create Job'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Jobs
