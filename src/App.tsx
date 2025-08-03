import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { OrderHistory } from "./pages/OrderHistoryOptimized";
import { Login } from "./pages/Login";
import { LandingPage } from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import { StoreManagementPage } from "./pages/StoreManagementPage";
import ServiceManagement from "./pages/ServiceManagement";
import { AuthProvider } from "./contexts/AuthContext";
import { StoreProvider } from "./contexts/StoreContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { OwnerRoute } from "./components/auth/OwnerRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { queryClient } from "./lib/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route 
                path="/pos" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order-history" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <OrderHistory />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/services" 
                element={
                  <ProtectedRoute>
                    <OwnerRoute>
                      <AppLayout>
                        <ServiceManagement />
                      </AppLayout>
                    </OwnerRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/stores" 
                element={
                  <ProtectedRoute>
                    <OwnerRoute>
                      <AppLayout>
                        <StoreManagementPage />
                      </AppLayout>
                    </OwnerRoute>
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
