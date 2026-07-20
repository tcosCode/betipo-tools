import { lazy, Suspense, useState } from "react";
import FormationGrid from "./FormationGrid";
import MaintenanceToggle from "./MaintenanceToggle";

const CampaignsTab = lazy(() => import("./campaigns/CampaignsTab"));
const PlansTab = lazy(() => import("./plans/PlansTab"));

type DashboardTab = "formaciones" | "mantenimiento" | "planes" | "campannas";

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("formaciones");

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto overflow-y-hidden border-b border-slate-200">
        <nav className="-mb-px flex min-w-max gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("formaciones")}
            className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === "formaciones"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            } `}
          >
            Formaciones
          </button>
          <button
            onClick={() => setActiveTab("mantenimiento")}
            className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === "mantenimiento"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            } `}
          >
            Mantenimiento
          </button>
          <button
            onClick={() => setActiveTab("planes")}
            className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === "planes"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            } `}
          >
            Planes
          </button>
          <button
            onClick={() => setActiveTab("campannas")}
            className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === "campannas"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            } `}
          >
            Campañas
          </button>
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === "formaciones" && (
          <FormationGrid initialFormations={[]} />
        )}
        {activeTab === "mantenimiento" && <MaintenanceToggle />}
        {activeTab === "planes" && (
          <Suspense
            fallback={
              <div className="py-12 text-center text-slate-500">
                Cargando planes…
              </div>
            }
          >
            <PlansTab />
          </Suspense>
        )}
        {activeTab === "campannas" && (
          <Suspense
            fallback={
              <div className="py-12 text-center text-slate-500">
                Cargando campañas…
              </div>
            }
          >
            <CampaignsTab />
          </Suspense>
        )}
      </div>
    </div>
  );
}
