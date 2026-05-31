import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThirdwebProvider } from "thirdweb/react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppLayout } from "@/components/AppLayout";
import { WalletAuthProvider } from "@/components/web3/WalletAuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminGuard } from "@/components/AdminGuard";
import { UserProvider } from "@/contexts/UserContext";

import Index from "./pages/Index.tsx";
import Cover from "./pages/Cover.tsx";
import CoverDetail from "./pages/CoverDetail.tsx";
import CoverLine from "./pages/CoverLine.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Claims from "./pages/Claims.tsx";
import Stake from "./pages/Stake.tsx";
import Governance from "./pages/Governance.tsx";
import ProposalDetail from "./pages/ProposalDetail.tsx";
import Profile from "./pages/Profile.tsx";
import Admin from "./pages/Admin.tsx";
import AdminClaims from "./pages/AdminClaims.tsx";
import AdminClaimDetail from "./pages/AdminClaimDetail.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import AdminAudit from "./pages/AdminAudit.tsx";
import NotFound from "./pages/NotFound.tsx";

const App = () => (
  <ErrorBoundary>
    <ThirdwebProvider>
      <UserProvider>
        <WalletAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  {/* ── Public routes ─────────────────────────────── */}
                  <Route path="/" element={<Index />} />
                  <Route path="/cover" element={<Cover />} />
                  <Route path="/cover/line/:line" element={<CoverLine />} />
                  <Route path="/cover/:id" element={<CoverDetail />} />
                  <Route path="/app" element={<Dashboard />} />
                  <Route path="/claims" element={<Claims />} />
                  <Route path="/stake" element={<Stake />} />
                  <Route path="/governance" element={<Governance />} />
                  <Route path="/governance/:id" element={<ProposalDetail />} />
                  <Route path="/profile" element={<Profile />} />

                  {/* ── Admin routes (role-gated) ───────────────── */}
                  <Route
                    path="/admin"
                    element={
                      <AdminGuard>
                        <Admin />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/claims"
                    element={
                      <AdminGuard>
                        <AdminClaims />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/claims/:id"
                    element={
                      <AdminGuard>
                        <AdminClaimDetail />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminGuard requiredRole="admin">
                        <AdminUsers />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/audit"
                    element={
                      <AdminGuard requiredRole="admin">
                        <AdminAudit />
                      </AdminGuard>
                    }
                  />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WalletAuthProvider>
      </UserProvider>
    </ThirdwebProvider>
  </ErrorBoundary>
);

export default App;
