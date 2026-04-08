import { Outlet } from "react-router";
import { AddBuildingForm } from "./components/AddBuildingForm";
import { Building2 } from "lucide-react";
import { Link, useLocation } from "react-router";

export function Root({ buildings, onAddBuilding }: any) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Building2 className="size-6" />
            <span>Gestor de Propiedades</span>
          </Link>
          {isHome && <AddBuildingForm onAdd={onAddBuilding} />}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
