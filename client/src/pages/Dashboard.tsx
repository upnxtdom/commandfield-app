import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Clock, CheckCircle, DollarSign,
  Plus, UserPlus, FileText, BarChart3,
} from "lucide-react";
import { useAuth } from '@/context/AuthContext'

const quickActions = [
  { label: "New Job", icon: Plus, path: "/jobs" },
  { label: "New Customer", icon: UserPlus, path: "/customers" },
  { label: "Send Invoice", icon: FileText, path: "/invoices" },
  { label: "View KPIs", icon: BarChart3, path: "/kpi" },
];

const chips = ["jobs today", "kpi week", "workers"];

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

const workerStatus = (status: string) => {
  const map: Record<string, string> = {
    active:   'Active',
    inactive: 'Inactive',
    busy:     'On Job',
  }
  return map[status] || status
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth()

  console.log('Dashboard render:', {
    hasSession: !!session,
    hasToken: !!session?.access_token,
    hasProfile: !!profile,
    businessId: profile?.business_id
  })

  const [kpi, setKpi] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const bid = profile!.business_id
    const token = session!.access_token
    const headers = { Authorization: `Bearer ${token}` }
    console.log('Fetching with token:', session?.access_token?.substring(0, 20))
    try {
      const [kpiRes, jobsRes, workersRes] = await Promise.all([
        fetch(`/api/kpi/${bid}/today`, { headers }),
        fetch(`/api/jobs/${bid}`, { headers }),
        fetch(`/api/workers/${bid}`, { headers })
      ])
      const kpiData = await kpiRes.json()
      const jobsData = await jobsRes.json()
      const workersData = await workersRes.json()
      setKpi(kpiData.data ?? kpiData)
      const jobsArray = Array.isArray(jobsData) ? jobsData : (jobsData.data ?? [])
      const workersArray = Array.isArray(workersData) ? workersData : (workersData.data ?? [])
      setJobs(jobsArray.slice(0, 5))
      setWorkers(workersArray.slice(0, 3))
    } catch (e) {
      console.log('Dashboard fetch error:', e)
      setError('Failed to load dashboard data')
    } finally {
      setDataLoading(false)
    }
  }, [profile?.business_id, session?.access_token])

  useEffect(() => {
    if (session?.access_token && profile?.business_id) {
      fetchData()
    }
  }, [session?.access_token, profile?.business_id, fetchData])

  const kpiCards = [
    { label: "Jobs Today",     value: kpi?.jobs_scheduled ?? 0,                                    icon: Briefcase },
    { label: "In Progress",    value: kpi?.jobs_in_progress ?? 0,                                   icon: Clock,        color: "text-accent" },
    { label: "Completed",      value: kpi?.jobs_completed ?? 0,                                     icon: CheckCircle,  color: "text-success" },
    { label: "Revenue Today",  value: `$${(kpi?.revenue_today ?? 0).toLocaleString()}`,             icon: DollarSign,   color: "text-success" },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className={`h-4 w-4 ${card.color || "text-muted-foreground"}`} />
            </div>
            <div className={`text-2xl font-bold ${card.color || "text-foreground"}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Main 2-column */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left - Active Jobs */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-semibold text-foreground">Active Jobs</h2>
          {dataLoading ? (
            <>
              <div className="h-8 rounded bg-muted animate-pulse" />
              <div className="h-8 rounded bg-muted animate-pulse" />
              <div className="h-8 rounded bg-muted animate-pulse" />
            </>
          ) : error ? (
            <div className="space-y-2">
              <p className="text-sm text-red-500">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchData}>Retry</Button>
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs scheduled today</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <span className="text-sm text-foreground">{job.title}</span>
                  {job.address && (
                    <p className="text-xs text-muted-foreground">{job.address}</p>
                  )}
                  {job.scheduled_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full text-white ${statusColor(job.status)}`}>
                  {formatStatus(job.status)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <Button
                  key={a.label}
                  variant="outline"
                  className="justify-start gap-2 border-border text-foreground hover:bg-muted"
                  onClick={() => navigate(a.path)}
                >
                  <a.icon className="h-4 w-4" />
                  {a.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Workers */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Workers</h2>
            {dataLoading ? (
              <>
                <div className="h-8 rounded bg-muted animate-pulse" />
                <div className="h-8 rounded bg-muted animate-pulse" />
                <div className="h-8 rounded bg-muted animate-pulse" />
              </>
            ) : workers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No workers added yet</p>
            ) : (
              workers.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-foreground">
                    {w.status === 'active' ? '🟢' : w.status === 'busy' ? '🟠' : '🔴'} {w.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{workerStatus(w.status)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dispatch command input */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="font-semibold text-foreground">Dispatch Command</h2>
        <input
          type="text"
          placeholder="Type a command..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-2 flex-wrap">
          {chips.map((chip) => (
            <span
              key={chip}
              className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
