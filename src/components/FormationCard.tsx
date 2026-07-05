import Swal from "sweetalert2";

import type { Formation } from "../types";
import { formatSpainDateTime } from "../utils/dates";

interface FormationCardProps {
  formation: Formation;
  onEdit: (formation: Formation) => void;
  onDelete: (id: number) => void;
}

export function FormationCard({
  formation,
  onEdit,
  onDelete,
}: FormationCardProps) {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium tracking-wide text-blue-700 uppercase">
            {formation.entidad}
          </div>
          {formation.oculta && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
              Oculta
            </span>
          )}
        </div>

        <h3
          className="mb-2 line-clamp-2 text-lg font-bold text-slate-900"
          title={formation.asunto}
        >
          {formation.asunto}
        </h3>

        <p className="mb-4 line-clamp-3 text-sm text-slate-600">
          {formation.descripcion}
        </p>

        <div className="space-y-1 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {formatSpainDateTime(formation.fecha_inicio)} -{" "}
              {formatSpainDateTime(formation.fecha_fin)}
            </span>
          </div>
          {formation.enlace && (
            <a
              href={formation.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>Ver enlace</span>
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
        <button
          onClick={() => onEdit(formation)}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
          Editar
        </button>

        <button
          onClick={async () => {
            const result = await Swal.fire({
              title: "¿Eliminar formación?",
              text: "Esta acción no se puede deshacer",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#d33",
              cancelButtonColor: "#6b7280",
              confirmButtonText: "Sí, eliminar",
              cancelButtonText: "Cancelar",
            });

            if (result.isConfirmed) {
              onDelete(formation.id);
            }
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-red-500 transition-colors hover:text-red-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
