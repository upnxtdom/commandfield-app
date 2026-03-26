import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

type TabType = 'today' | 'week' | 'month'

const TABS: { label: string; value: TabType }[] = [
  { label: 'Today',     value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

const formatCurrency = (val: number) =>
  '$' + (val ?? 0).toLocaleString()

interface KpiData {
  jobs_scheduled:   number
  jobs_in_progress: number
  jobs_completed:   number
  jobs_cancelled?:  number
  revenue_today:    number
  workers_active:   number
  avg_job_duration?: number
}

const StatCard = ({
  label, value, valueClass = 'text-foreground'
}: { label: string; value: string | number; valueClass?: string }) => (
  <div className="rounded-lg bg-[#1E293B] p-4 space-y-1">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
  </div>
)

const SkeletonCard = () => (
  <div className="h-20 rounded-lg bg-muted animate-pulse" />
)

const PerfRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground">{value}</span>
  </div>
)

const Kpi = () => {
  const { session, profile } = useAuth()
  const [kpiToday, setKpiToday]   = useState<KpiData | null>(null)
  const [kpiWeek, setKpiWeek]     = useState<KpiData | null>(null)
  const [kpiMonth, setKpiMonth]   = useState<KpiData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('today')

  const fetchKpi = useCallback(async () => {
    setLoading(true)
    setError(null)
    const bid = profile!.business_id
    const token = session!.access_token
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [rToday, rWeek, rMonth] = await Promise.all([
        fetch(`/api/kpi/${bid}/today`, { headers }).then(r => r.json()),
        fetch(`/api/kpi/${bid}/week`,  { headers }).then(r => r.json()),
        fetch(`/api/kpi/${bid}/month`, { headers }).then(r => r.json()),
      ])
      setKpiToday(rToday.data  ?? rToday)
      setKpiWeek(rWeek.data    ?? rWeek)
      setKpiMonth(rMonth.data  ?? rMonth)
    } catch {
      setError('Failed to load KPI data')
    } finally {
      setLoading(false)
    }
  }, [profile?.business_id, session?.access_token])

  useEffect(() => {
    if (session?.access_token && profile?.business_id) {
      fetchKpi()
    }
  }, [session?.access_token, profile?.business_id, fetchKpi])

  const activeKpi =
    activeTab === 'today' ? kpiToday :
    activeTab === 'week'  ? kpiWeek  :
    kpiMonth

  const revenue = activeKpi?.revenue_today ?? 0

  // Performance calculations
  const scheduled = activeKpi?.jobs_scheduled  ?? 0
  const completed  = activeKpi?.jobs_completed  ?? 0
  const inProgress = activeKpi?.jobs_in_progress ?? 0
  const workersActive = activeKpi?.workers_active ?? 0

  const completionRate = scheduled > 0
    ? (completed / scheduled * 100).toFixed(0) + '%'
    : 'N/A'

  const jobsPerDay = activeTab === 'week'
    ? (scheduled / 7).toFixed(1)
    : activeTab === 'month'
    ? (scheduled / 30).toFixed(1)
    : null

  const revenuePerJob = completed > 0
    ? formatCurrency(Math.round(revenue / completed))
    : 'N/A'

  const utilization = workersActive > 0
    ? (inProgress / workersActive * 100).toFixed(0) + '%'
    : 'N/A'

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground">KPI Dashboard</h1>

      {/* Tab bar */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === t.value
                ? 'bg-blue-600 text-white'
                : 'bg-[#1E293B] text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="space-y-2">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchKpi}>Retry</Button>
        </div>
      ) : loading ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard />
        </>
      ) : (
        <>
          {/* Row 1 — 4 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Jobs Scheduled"
              value={activeKpi?.jobs_scheduled ?? 0}
            />
            <StatCard
              label="In Progress"
              value={activeKpi?.jobs_in_progress ?? 0}
              valueClass="text-amber-400"
            />
            <StatCard
              label="Completed"
              value={activeKpi?.jobs_completed ?? 0}
              valueClass="text-green-400"
            />
            <StatCard
              label="Cancelled"
              value={activeKpi?.jobs_cancelled ?? 0}
              valueClass="text-red-400"
            />
          </div>

          {/* Row 2 — 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Revenue"
              value={formatCurrency(revenue)}
              valueClass="text-green-400"
            />
            <StatCard
              label="Active Workers"
              value={activeKpi?.workers_active ?? 0}
            />
            <StatCard
              label="Avg Job Duration"
              value={
                activeKpi?.avg_job_duration
                  ? activeKpi.avg_job_duration + ' min'
                  : 'N/A'
              }
            />
          </div>

          {/* Performance summary */}
          <div className="rounded-lg bg-[#1E293B] p-5 space-y-1">
            <p className="text-sm font-semibold text-foreground mb-3">Performance Summary</p>
            <PerfRow label="Completion Rate" value={completionRate} />
            {jobsPerDay !== null && (
              <PerfRow
                label={activeTab === 'week' ? 'Jobs Per Day (week)' : 'Jobs Per Day (month)'}
                value={jobsPerDay}
              />
            )}
            <PerfRow label="Revenue Per Job"     value={revenuePerJob} />
            <PerfRow label="Worker Utilization"  value={utilization} />
          </div>
        </>
      )}
    </div>
  )
}

export default Kpi
