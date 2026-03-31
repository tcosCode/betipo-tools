import { useState } from "react";
import FormationGrid from "./FormationGrid";
import MaintenanceToggle from "./MaintenanceToggle";

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState<"formaciones" | "mantenimiento">(
    "formaciones",
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
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
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === "formaciones" ? (
          <FormationGrid initialFormations={[]} />
        ) : (
          <MaintenanceToggle />
        )}
      </div>
    </div>
  );
}
