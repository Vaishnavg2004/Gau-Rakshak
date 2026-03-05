import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import DashboardPage from "./pages/DashboardPage";
import CowsPage from "./pages/CowsPage";
import ReportsPage from "./pages/ReportsPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import { AuthProvider, useAuth } from "./lib/auth";
import { Card } from "./components/ui/card";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex min-h-screen w-full animate-fade-in">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar userName={user.name} userEmail={user.email} role={user.role} onLogout={signOut} />
        <main className="ml-64 mt-16 flex-1 p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cows" element={<CowsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/settings" element={user.role === "admin" ? <SettingsPage /> : <AdminOnly />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const AdminOnly = () => (
  <Card className="mx-auto mt-8 max-w-lg p-8 text-center">
    <h3 className="text-xl font-semibold text-foreground">Admin Access Required</h3>
    <p className="mt-2 text-muted-foreground">Only admin accounts can open Settings.</p>
  </Card>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
