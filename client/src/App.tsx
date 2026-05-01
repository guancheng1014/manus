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
import SystemSettings from "./pages/SystemSettings";
import PaymentPage from "./pages/PaymentPage";
import OrderHistory from "./pages/OrderHistory";
import CardKeyPurchase from "./pages/CardKeyPurchase";
import PaymentManagement from "./pages/PaymentManagement";
import AIOptimizationAdvisor from "./pages/AIOptimizationAdvisor";
import DashboardLayout from "./components/DashboardLayout";
import { AIAssistant } from "./components/AIAssistant";
import UserProfile from "./pages/UserProfile";
import OutlookRegistration from "./pages/OutlookRegistration";
import EmailVerification from "./pages/EmailVerification";
import SMSVerification from "./pages/SMSVerification";
import VerificationDashboard from "./pages/VerificationDashboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/activate"} component={CardKeyActivation} />
      <Route path={"/payment"} component={PaymentPage} />
      <Route path={"/purchase"} component={CardKeyPurchase} />
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
        <Route path={"/dashboard/orders"} component={OrderHistory} />
        <Route path={"/dashboard/proxy"} component={ProxyConfiguration} />
        <Route path={"/dashboard/users"} component={UserManagement} />
        <Route path={"/dashboard/settings"} component={SystemSettings} />
        <Route path={"/dashboard/admin"} component={AdminDashboard} />
        <Route path={"/dashboard/payment"} component={PaymentManagement} />
        <Route path={"/dashboard/ai-advisor"} component={AIOptimizationAdvisor} />
        <Route path={"/dashboard/profile"} component={UserProfile} />
        <Route path={"/dashboard/outlook-register"} component={OutlookRegistration} />
        <Route path={"/dashboard/email-verification"} component={EmailVerification} />
        <Route path={"/dashboard/sms-verification"} component={SMSVerification} />
        <Route path={"/dashboard/verification-dashboard"} component={VerificationDashboard} />
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
          <AIAssistant />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
