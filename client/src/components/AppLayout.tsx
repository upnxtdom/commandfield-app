import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, MapPin, Users, UserCheck,
  FileText, BarChart3, CreditCard, Settings, Bell, Plus,
  Zap, LogOut, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Jobs", path: "/jobs", icon: Briefcase },
  { title: "Dispatch", path: "/dispatch", icon: MapPin },
  { title: "Workers", path: "/workers", icon: Users },
  { title: "Customers", path: "/customers", icon: UserCheck },
  { title: "Invoices", path: "/invoices", icon: FileText },
  { title: "KPI", path: "/kpi", icon: BarChart3 },
  { title: "Billing", path: "/billing", icon: CreditCard },
  { title: "Settings", path: "/settings", icon: Settings },
];

const mobileNav = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Jobs", path: "/jobs", icon: Briefcase },
  { title: "Dispatch", path: "/dispatch", icon: MapPin },
  { title: "Workers", path: "/workers", icon: Users },
  { title: "More", path: "/settings", icon: MoreHorizontal },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/": "Dashboard",
  "/jobs": "Jobs",
  "/dispatch": "Dispatch",
  "/workers": "Workers",
  "/customers": "Customers",
  "/invoices": "Invoices",
  "/kpi": "KPI",
  "/billing": "Billing",
  "/settings": "Settings",
};

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = pageTitles[location.pathname] || "CommandField";

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-background shrink-0">
        <div className="flex items-center gap-2 px-4 h-14 border-b">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-bold text-foreground">CommandField</span>
        </div>
        <nav className="flex-1 py-2 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                JD
              </div>
              <div className="text-sm">
                <div className="font-medium text-foreground">John Doe</div>
                <div className="text-xs text-muted-foreground">Admin</div>
              </div>
            </div>
            <button onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between h-14 border-b px-4 md:px-6 shrink-0">
          <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Job</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex z-50">
        {mobileNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 mb-0.5" />
              {item.title}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default AppLayout;
