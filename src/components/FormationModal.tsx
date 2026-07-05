import React, { useState, useEffect } from "react";
import type { Formation } from "../types";
import { utcToSpain, spainToUtc } from "../utils/dates";

interface FormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formation: Partial<Formation>) => void;
  formation: Formation | null;
  isLoading: boolean;
}

export function FormationModal({
  isOpen,
  onClose,
  onSubmit,
  formation,
  isLoading,
}: FormationModalProps) {
  const [formData, setFormData] = useState<Partial<Formation>>({
    asunto: "",
    entidad: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    enlace: "",
    oculta: false,
  });

  useEffect(() => {
    if (formation) {
      setFormData({
        ...formation,
        fecha_inicio: utcToSpain(formation.fecha_inicio as string),
        fecha_fin: utcToSpain(formation.fecha_fin as string),
      });
    } else {
      setFormData({
        asunto: "",
        entidad: "",
        descripcion: "",
        fecha_inicio: "",
        fecha_fin: "",
        enlace: "",
        oculta: false,
      });
    }
  }, [formation, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Convertir fechas de España a UTC antes de enviar
    const dataToSend = {
      ...formData,
      fecha_inicio: spainToUtc(formData.fecha_inicio as string),
      fecha_fin: spainToUtc(formData.fecha_fin as string),
    };

    onSubmit(dataToSend);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ zIndex: 9999 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="bg-opacity-75 fixed inset-0 bg-gray-500 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>
        <span
          className="hidden sm:inline-block sm:h-screen sm:align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="relative z-50 inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="mb-4 text-lg leading-6 font-medium text-gray-900">
                {formation ? "Editar Formación" : "Nueva Formación"}
              </h3>

              {/* Aviso de zona horaria */}
              <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <span className="font-medium">⏰ Zona horaria:</span> Las fechas
                se muestran y guardan en hora de España (Europe/Madrid)
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="asunto"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Asunto
                  </label>
                  <input
                    type="text"
                    name="asunto"
                    id="asunto"
                    required
                    value={formData.asunto}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="entidad"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Entidad
                  </label>
                  <input
                    type="text"
                    name="entidad"
                    id="entidad"
                    required
                    value={formData.entidad}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="descripcion"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    id="descripcion"
                    rows={3}
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="fecha_inicio"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Fecha Inicio (España)
                    </label>
                    <input
                      type="datetime-local"
                      name="fecha_inicio"
                      id="fecha_inicio"
                      required
                      value={String(formData.fecha_inicio)}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="fecha_fin"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Fecha Fin (España)
                    </label>
                    <input
                      type="datetime-local"
                      name="fecha_fin"
                      id="fecha_fin"
                      required
                      value={String(formData.fecha_fin)}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="enlace"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Enlace
                  </label>
                  <input
                    type="url"
                    name="enlace"
                    id="enlace"
                    value={formData.enlace}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="oculta"
                    name="oculta"
                    type="checkbox"
                    checked={formData.oculta}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="oculta"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Oculta
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isLoading ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
