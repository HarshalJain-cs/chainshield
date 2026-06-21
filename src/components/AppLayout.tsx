import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import skyBg from "@/assets/sky-bg.jpg";
import { ReactLenis } from "lenis/react";

function RouteFallback() {
  return (
    <div className="container py-20 flex items-center justify-center">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/50 animate-pulse">
        Loading…
      </div>
    </div>
  );
}

export const AppLayout = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <div className="min-h-screen flex flex-col relative">
        {/* Sky background — fixed, dithered */}
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${skyBg})` }}
          aria-hidden
        />
        <div className="fixed inset-0 -z-10 bg-noise opacity-30 mix-blend-multiply pointer-events-none" aria-hidden />
        {!isHome && <div className="fixed inset-0 -z-10 bg-background/85 pointer-events-none" aria-hidden />}

        <TopNav />
        <main className="flex-1 pt-6">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </ReactLenis>
  );
};