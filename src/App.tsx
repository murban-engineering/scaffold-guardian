import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import Index from "./pages/Index";
import Sites from "./pages/Sites";
import ClientReport from "./pages/ClientReport";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import AddScaffold from "./pages/AddScaffold";
import MaintenanceLogs from "./pages/MaintenanceLogs";
import Revenue from "./pages/Revenue";
import Accounting from "./pages/Accounting";
import SiteMasterPlan from "./pages/SiteMasterPlan";
import ItemTracking from "./pages/ItemTracking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

// Mounts realtime sync globally so ALL pages stay in sync across all users
const GlobalSync = () => {
  useRealtimeSync();
  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <GlobalSync />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sites"
              element={
                <ProtectedRoute>
                  <Sites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/previous-clients"
              element={
            <ProtectedRoute>
                  <ClientReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-scaffold"
              element={
                <ProtectedRoute>
                  <AddScaffold />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance-logs"
              element={
                <ProtectedRoute>
                  <MaintenanceLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/revenue"
              element={
                <ProtectedRoute>
                  <Revenue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting"
              element={
                <ProtectedRoute>
                  <Accounting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/site-master-plan"
              element={
                <ProtectedRoute>
                  <SiteMasterPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/item-tracking"
              element={
                <ProtectedRoute>
                  <ItemTracking />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
