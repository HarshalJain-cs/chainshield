import { lazy } from "react";
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

// Landing page is eager for fast first paint; the rest are code-split per route.
import Index from "./pages/Index.tsx";
const Cover = lazy(() => import("./pages/Cover.tsx"));
const CoverDetail = lazy(() => import("./pages/CoverDetail.tsx"));
const CoverLine = lazy(() => import("./pages/CoverLine.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Claims = lazy(() => import("./pages/Claims.tsx"));
const Stake = lazy(() => import("./pages/Stake.tsx"));
const Governance = lazy(() => import("./pages/Governance.tsx"));
const ProposalDetail = lazy(() => import("./pages/ProposalDetail.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminClaims = lazy(() => import("./pages/AdminClaims.tsx"));
const AdminClaimDetail = lazy(() => import("./pages/AdminClaimDetail.tsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.tsx"));
const AdminAudit = lazy(() => import("./pages/AdminAudit.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

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
