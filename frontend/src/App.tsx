import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { muiTheme } from "./theme/muiTheme";
import { TransactionProvider } from "./context/TransactionContext";
import { DashboardLayout } from "./components/Layout/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ExpenseVisualization from "./pages/ExpenseVisualization";
import FinancialInsights from "./pages/FinancialInsights";
import AIAdvisor from "./pages/AIAdvisor";
import ExpenseTracker from "./pages/ExpenseTracker";
import InventoryManagement from "./pages/InventoryManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <TransactionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<DashboardLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="expenses" element={<ExpenseVisualization />} />
                <Route path="insights" element={<FinancialInsights />} />
                <Route path="advisor" element={<AIAdvisor />} />
                <Route path="tracker" element={<ExpenseTracker />} />
                <Route path="inventory" element={<InventoryManagement />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TransactionProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
