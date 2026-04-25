import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { AppStoreProvider } from "@/lib/store";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Dashboard from "./pages/Dashboard.tsx";
import Recommendations from "./pages/Recommendations.tsx";
import Products from "./pages/Products.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import Inbox from "./pages/Inbox.tsx";
import MyMandate from "./pages/MyMandate.tsx";
import Watchlist from "./pages/Watchlist.tsx";
import MarketViewsPage from "./pages/MarketViewsPage.tsx";
import OutboxPage from "./pages/Outbox.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AppStoreProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <RequireAuth>
                      <AppLayout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/recommendations" element={<Recommendations />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/products/:id" element={<ProductDetail />} />
                          <Route path="/inbox" element={<Inbox />} />
                          <Route path="/outbox" element={<OutboxPage />} />
                          <Route path="/watchlist" element={<Watchlist />} />
                          <Route path="/mandate" element={<MyMandate />} />
                          <Route path="/market" element={<MarketViewsPage />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AppLayout>
                    </RequireAuth>
                  }
                />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppStoreProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
