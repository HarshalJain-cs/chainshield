import { Outlet } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export const AppLayout = () => (
  <div className="min-h-screen flex flex-col">
    <TopNav />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);