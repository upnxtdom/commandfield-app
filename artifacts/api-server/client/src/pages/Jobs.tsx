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

const Jobs = () => {
  const { session, profile } = useAuth()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/jobs/${profile!.business_id}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` }
      })
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : (data.data ?? []))
    } catch (e) {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [profile?.business_id, session?.access_token])

  useEffect(() => {
    if (session?.access_token && profile?.business_id) {
      fetchJobs()
    }
  }, [session?.access_token, profile?.business_id, fetchJobs])

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
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
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
    </div>
  )
}

export default Jobs
