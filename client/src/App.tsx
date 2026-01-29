import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/components/i18n-provider";
import { AuthProvider } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { ContactButton } from "@/components/contact-button";
import Home from "@/pages/home";
import Book from "@/pages/book";
import WorkerProfile from "@/pages/worker";
import AdminDashboard from "@/pages/admin";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/book" component={Book} />
      <Route path="/worker" component={WorkerProfile} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const hideBottomNav = location === "/book" || location === "/login";

  return (
    <div className="min-h-screen bg-background">
      <Router />
      <ContactButton />
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
