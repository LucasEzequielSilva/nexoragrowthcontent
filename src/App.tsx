import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ContentCalendar from "./pages/ContentCalendar";
import ContentIdeas from "./pages/ContentIdeas";
import Competitors from "./pages/Competitors";
import CompetitorContent from "./pages/CompetitorContent";
import ContentPillars from "./pages/ContentPillars";
import WeeklyBriefs from "./pages/WeeklyBriefs";
import Carousels from "./pages/Carousels";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading, switching } = useAuth();

  if (loading || switching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<ContentCalendar />} />
        <Route path="/ideas" element={<ContentIdeas />} />
        <Route path="/competitors" element={<Competitors />} />
        <Route path="/competitors/content" element={<CompetitorContent />} />
        <Route path="/pillars" element={<ContentPillars />} />
        <Route path="/carousels" element={<Carousels />} />
        <Route path="/briefs" element={<WeeklyBriefs />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AuthRoutes() {
  const { user, loading, switching } = useAuth();

  if (loading || switching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthRoutes />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
