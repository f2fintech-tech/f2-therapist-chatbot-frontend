import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FinHealChat from "@/pages/FinHealChat";
import NotFound from "@/pages/not-found";

function resolveCodespacesBackendFromCurrentHost(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const { protocol, hostname } = window.location;
  if (protocol !== "https:" || !hostname.endsWith(".app.github.dev")) {
    return null;
  }

  return `https://${hostname.replace(/-\d+\./, "-8000.")}/api/v1`;
}

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    if (typeof window !== "undefined") {
      const { protocol, hostname } = window.location;
      const isCodespacesFrontend = protocol === "https:" && hostname.endsWith(".app.github.dev");
      const isLocalFrontend = hostname === "localhost" || hostname === "127.0.0.1";
      const isLocalHttpTarget = configured.startsWith("http://localhost") || configured.startsWith("http://127.0.0.1");
      const isCodespacesTarget = configured.includes(".app.github.dev");

      if (isCodespacesFrontend && (isLocalHttpTarget || isCodespacesTarget)) {
        return resolveCodespacesBackendFromCurrentHost() || configured;
      }

      if (isLocalFrontend && isCodespacesTarget) {
        return "http://localhost:8000/api/v1";
      }
    }

    return configured;
  }

  const codespacesBackend = resolveCodespacesBackendFromCurrentHost();
  if (codespacesBackend) {
    return codespacesBackend;
  }

  return "http://localhost:8000/api/v1";
}

const apiBaseUrl = resolveApiBaseUrl();
const getOrigin = () => {
  if (apiBaseUrl.startsWith("/")) {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
  try {
    return new URL(apiBaseUrl).origin;
  } catch (e) {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
};
setBaseUrl(getOrigin());

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={FinHealChat} />
      <Route path="/chat" component={FinHealChat} />
      <Route path="/login" component={FinHealChat} />
      <Route path="/signup" component={FinHealChat} />
      <Route path="/profile" component={FinHealChat} />
      <Route path="/advisor" component={FinHealChat} />
      <Route path="/admin" component={FinHealChat} />
      <Route path="/dashboard" component={FinHealChat} />
      <Route path="/education" component={FinHealChat} />
      <Route path="/loan-calculator" component={FinHealChat} />
      <Route path="/cibil-analyzer" component={FinHealChat} />
      <Route path="/eligibility-cibil" component={FinHealChat} />
      <Route path="/reminders" component={FinHealChat} />
      <Route path="/goals" component={FinHealChat} />
      <Route path="/tests/:id" component={FinHealChat} />
      <Route path="/tests" component={FinHealChat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
