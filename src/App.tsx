import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { HomePage } from "./pages/HomePage";
import { OrderHistory } from "./pages/OrderHistoryOptimized";
import { Login } from "./pages/Login";
import { SmartHomePage } from "./pages/SmartHomePage";
import NotFound from "./pages/NotFound";
import { StoreManagementPage } from "./pages/StoreManagementPage";
import ServiceManagement from "./pages/ServiceManagement";
import { ExpensesPage } from "./pages/ExpensesPage";
import { AuthProvider } from "./contexts/AuthContext";
import { StoreProvider } from "./contexts/StoreContext";
import { ThermalPrinterProvider } from "./contexts/ThermalPrinterContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { OwnerRoute } from "./components/auth/OwnerRoute";
import { ProtectedRedirect } from "./components/auth/ProtectedRedirect";
import { AppLayout } from "./components/layout/AppLayout";
import { queryClient } from "./lib/queryClient";
import { PublicReceiptPage } from "./pages/PublicReceiptPage";
import { PWAManagementPage } from "./pages/PWAManagementPage";
import { CustomersPage } from "./pages/CustomersPage";
import { WhatsAppBroadcastPage } from "./pages/WhatsAppBroadcastPage";
import { RevenueReportPage } from "./pages/RevenueReportPage";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner 
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            minWidth: '320px',
            maxWidth: '500px',
            width: '90vw',
            padding: '16px',
            fontSize: '16px',
            borderRadius: '12px',
          },
        }}
      />
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <ThermalPrinterProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<SmartHomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/receipt/:orderId" element={<PublicReceiptPage />} />
                <Route path="/install" element={<PWAManagementPage />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/home" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <HomePage />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
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
                  path="/customers" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CustomersPage />
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
                <Route 
                  path="/whatsapp-broadcast" 
                  element={
                    <ProtectedRoute>
                      <OwnerRoute>
                        <AppLayout>
                          <WhatsAppBroadcastPage />
                        </AppLayout>
                      </OwnerRoute>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/revenue-report" 
                  element={
                    <ProtectedRoute>
                      <OwnerRoute>
                        <AppLayout>
                          <RevenueReportPage />
                        </AppLayout>
                      </OwnerRoute>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/expenses" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ExpensesPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<ProtectedRedirect />} />
              </Routes>
            </ThermalPrinterProvider>
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
      {/* ReactQueryDevtools disabled - uncomment for development debugging */}
      {/* {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )} */}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
