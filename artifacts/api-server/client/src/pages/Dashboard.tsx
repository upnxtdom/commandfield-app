import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Clock, CheckCircle, DollarSign,
  Plus, UserPlus, FileText, BarChart3,
} from "lucide-react";

const kpis = [
  { label: "Jobs Today", value: "8", icon: Briefcase },
  { label: "In Progress", value: "3", icon: Clock, color: "text-accent" },
  { label: "Completed", value: "4", icon: CheckCircle, color: "text-success" },
  { label: "Revenue Today", value: "$4,200", icon: DollarSign, color: "text-success" },
];

const jobs = [
  { name: "AC Unit Repair", status: "In Progress", color: "bg-accent" },
  { name: "Plumbing Fix", status: "Scheduled", color: "bg-primary" },
  { name: "HVAC Inspection", status: "Completed", color: "bg-success" },
];

const workers = [
  { name: "Mike Torres", status: "🟢", task: "In Progress: AC Unit Repair" },
  { name: "Sarah Chen", status: "🟢", task: "Scheduled: Plumbing Fix" },
  { name: "James Wilson", status: "🟡", task: "Available" },
];

const quickActions = [
  { label: "New Job", icon: Plus, path: "/jobs" },
  { label: "New Customer", icon: UserPlus, path: "/customers" },
  { label: "Send Invoice", icon: FileText, path: "/invoices" },
  { label: "View KPIs", icon: BarChart3, path: "/kpi" },
];

const chips = ["jobs today", "kpi week", "workers"];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.color || "text-muted-foreground"}`} />
            </div>
            <div className={`text-2xl font-bold ${kpi.color || "text-foreground"}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Main 2-column */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left - Active Jobs */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-semibold text-foreground">Active Jobs</h2>
          {jobs.map((job) => (
            <div key={job.name} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-foreground">{job.name}</span>
              <span className={`text-xs px-2 py-1 rounded-full text-foreground ${job.color}`}>
                {job.status}
              </span>
            </div>
          ))}
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
            {workers.map((w) => (
              <div key={w.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-foreground">
                  {w.status} {w.name}
                </span>
                <span className="text-xs text-muted-foreground">{w.task}</span>
              </div>
            ))}
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
