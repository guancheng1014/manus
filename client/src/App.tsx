import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CardKeyActivation from "./pages/CardKeyActivation";
import SingleRegister from "./pages/SingleRegister";
import BatchRegister from "./pages/BatchRegister";
import TaskMonitor from "./pages/TaskMonitor";
import AdminDashboard from "./pages/AdminDashboard";
import HistoryRecords from "./pages/HistoryRecords";
import ProxyConfiguration from "./pages/ProxyConfiguration";
import UserManagement from "./pages/UserManagement";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/activate"} component={CardKeyActivation} />
      <Route path={"/*"} component={DashboardRouter} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/dashboard/single"} component={SingleRegister} />
        <Route path={"/dashboard/batch"} component={BatchRegister} />
        <Route path={"/dashboard/monitor"} component={TaskMonitor} />
        <Route path={"/dashboard/history"} component={HistoryRecords} />
        <Route path={"/dashboard/proxy"} component={ProxyConfiguration} />
        <Route path={"/dashboard/users"} component={UserManagement} />
        <Route path={"/dashboard/admin"} component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
