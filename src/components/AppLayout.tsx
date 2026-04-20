import { Outlet, useLocation } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import skyBg from "@/assets/sky-bg.jpg";

export const AppLayout = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  return (
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
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};