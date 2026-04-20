import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="container py-32 text-center">
      <div className="font-display text-8xl md:text-9xl font-bold text-gradient">404</div>
      <p className="mt-4 text-xl text-muted-foreground">This route is not covered.</p>
      <p className="font-mono text-xs text-muted-foreground mt-1">{location.pathname}</p>
      <Button asChild className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
        <Link to="/">Return home</Link>
      </Button>
    </div>
  );
};

export default NotFound;
