import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThirdwebProvider } from "thirdweb/react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppLayout } from "@/components/AppLayout";
import { WalletAuthProvider } from "@/components/web3/WalletAuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import Index from "./pages/Index.tsx";
import Cover from "./pages/Cover.tsx";
import CoverDetail from "./pages/CoverDetail.tsx";
import CoverLine from "./pages/CoverLine.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Claims from "./pages/Claims.tsx";
import Stake from "./pages/Stake.tsx";
import Governance from "./pages/Governance.tsx";
import ProposalDetail from "./pages/ProposalDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const App = () => (
  <ErrorBoundary>
    <ThirdwebProvider>
      <WalletAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/cover" element={<Cover />} />
              <Route path="/cover/line/:line" element={<CoverLine />} />
              <Route path="/cover/:id" element={<CoverDetail />} />
              <Route path="/app" element={<Dashboard />} />
              <Route path="/claims" element={<Claims />} />
              <Route path="/stake" element={<Stake />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/governance/:id" element={<ProposalDetail />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </WalletAuthProvider>
    </ThirdwebProvider>
  </ErrorBoundary>
);


export default App;
