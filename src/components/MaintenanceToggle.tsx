import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { EnvSelector } from "./EnvSelector";

export default function MaintenanceToggle() {
  const [env, setEnv] = useState<"dev" | "prod">("dev");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, [env]);

  const fetchMaintenanceStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/configuracion/mantenimiento?env=${env}`);
      if (!response.ok) throw new Error("Error al cargar la configuración");
      const data = await response.json();
      setIsMaintenanceMode(data.en_mantenimiento);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la configuración");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar la configuración de mantenimiento",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnvChange = async (newEnv: "dev" | "prod") => {
    if (newEnv === "prod") {
      const result = await Swal.fire({
        title: "¿Cambiar a PRODUCCIÓN?",
        text: "Los cambios afectarán datos reales en la base de datos de producción.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) {
        return;
      }
    }
    setEnv(newEnv);
  };

  const toggleMaintenanceMode = async () => {
    const newValue = !isMaintenanceMode;
    const actionText = newValue ? "activar" : "desactivar";
    
    const result = await Swal.fire({
      title: `¿Estás seguro de ${actionText} el modo mantenimiento?`,
      text: newValue 
        ? "El sistema backend no estará disponible para los usuarios mientras esté en mantenimiento."
        : "El sistema backend volverá a estar disponible para todos los usuarios.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: newValue ? "#d33" : "#3085d6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/configuracion/mantenimiento?env=${env}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ en_mantenimiento: newValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar la configuración");
      }

      const data = await response.json();
      setIsMaintenanceMode(data.en_mantenimiento);

      Swal.fire({
        icon: "success",
        title: "Configuración actualizada",
        text: `El modo mantenimiento ha sido ${newValue ? "activado" : "desactivado"} correctamente.`,
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la configuración");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al actualizar la configuración de mantenimiento. Inténtalo de nuevo.",
      });
      // Revert initial UI switch on error automatically handled by fetching actual state on next cycle or just leaving as is
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Modo Mantenimiento
            </h1>
            <p className="mt-1 text-slate-500">
              Controla la disponibilidad general del backend del sistema
            </p>
          </div>

          <div className="flex items-center gap-4">
            <EnvSelector onChange={handleEnvChange} currentEnv={env} />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-medium text-slate-900 flex items-center gap-2">
              Estado actual del sistema
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
              )}
            </h2>
            <p className="text-slate-500 mt-2 max-w-2xl">
              Al activar el modo de mantenimiento, las aplicaciones conectadas al backend
              (entorno <strong>{env.toUpperCase()}</strong>) recibirán respuestas
              indicando que el sistema no está disponible.
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 border border-slate-100 min-w-[250px]">
            <div className="mb-4 text-lg font-semibold">
              <span className={isMaintenanceMode ? "text-red-600" : "text-emerald-600"}>
                {isMaintenanceMode ? "EN MANTENIMIENTO" : "OPERACIONAL"}
              </span>
            </div>
            
            <button 
              onClick={toggleMaintenanceMode}
              disabled={isLoading}
              className={`
                relative inline-flex h-10 w-20 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
                ${isMaintenanceMode ? 'bg-red-500' : 'bg-emerald-500'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              role="switch"
              aria-checked={isMaintenanceMode}
            >
              <span className="sr-only">Alternar modo mantenimiento</span>
              <span
                aria-hidden="true"
                className={`
                  pointer-events-none inline-block h-9 w-9 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${isMaintenanceMode ? 'translate-x-10' : 'translate-x-0'}
                `}
              />
            </button>
            <div className="mt-3 text-sm text-slate-500 font-medium">
              Click para {isMaintenanceMode ? 'desactivar' : 'activar'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
