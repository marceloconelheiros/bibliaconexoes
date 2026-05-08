import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BRAND } from "@/lib/brand";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-md space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">{BRAND.shortName}</p>
        <h1 className="font-display text-5xl font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">
          Esta página não existe ou foi movida.
        </p>
        <Link
          to="/"
          className="inline-flex text-primary font-medium underline-offset-4 hover:underline"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
