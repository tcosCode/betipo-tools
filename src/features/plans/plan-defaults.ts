import type { PlanAdmin, PlanWriteInput } from "./plan-schema";

export const createPlanDefaults = (): PlanWriteInput => ({
  nombre: "",
  usuarios: 3,
  valoracionesPlan: 300,
  captacionesPlan: null,
  permiteUsuarioExtra: true,
  precioPorUsuarioExtra: "2.99",
  precioPackValoracionExtra: "4.99",
  packValoracionExtra: 0,
  precio: "",
  detalles: [],
  items: [
    {
      nombre: "",
      precioFacturacion: "",
      cicloFacturacion: "MENSUAL",
      duracion: null,
    },
  ],
});

export const clonePlanValues = (plan: PlanAdmin): PlanWriteInput => ({
  nombre: `${plan.nombre} copia`,
  usuarios: plan.usuarios,
  valoracionesPlan: plan.valoracionesPlan,
  captacionesPlan: plan.captacionesPlan,
  permiteUsuarioExtra: plan.permiteUsuarioExtra,
  precioPorUsuarioExtra: plan.precioPorUsuarioExtra,
  precioPackValoracionExtra: plan.precioPackValoracionExtra,
  packValoracionExtra: plan.packValoracionExtra,
  precio: plan.precio,
  detalles: plan.detalles.map((detail) => ({ ...detail })),
  items: plan.items.map((item, index, items) => ({
    nombre: item.nombre,
    precioFacturacion: item.precioFacturacion,
    cicloFacturacion: item.cicloFacturacion,
    duracion: index === items.length - 1 ? null : item.duracion,
  })),
});

export const formatMoney = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount)
    : value;
};
