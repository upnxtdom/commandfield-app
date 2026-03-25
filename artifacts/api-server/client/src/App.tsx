import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import Jobs from "./pages/Jobs";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="dispatch" element={<PlaceholderPage title="Dispatch" />} />
          <Route path="workers" element={<PlaceholderPage title="Workers" />} />
          <Route path="customers" element={<PlaceholderPage title="Customers" />} />
          <Route path="invoices" element={<PlaceholderPage title="Invoices" />} />
          <Route path="kpi" element={<PlaceholderPage title="KPI" />} />
          <Route path="billing" element={<PlaceholderPage title="Billing" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route index element={<Dashboard />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
