import { describe, expect, it } from "vitest";

import { clonePlanValues, createPlanDefaults } from "./plan-defaults";
import {
  planWriteSchema,
  type PlanAdmin,
  type PlanWriteInput,
} from "./plan-schema";

const createValidPlan = (): PlanWriteInput => ({
  ...createPlanDefaults(),
  nombre: "Plan de prueba",
  precio: "29",
  detalles: [
    {
      key: "550e8400-e29b-41d4-a716-446655440000",
      text: "Tres usuarios",
    },
  ],
  items: [
    {
      nombre: "Promoción inicial",
      precioFacturacion: "19,99",
      cicloFacturacion: "MENSUAL",
      duracion: 2,
    },
    {
      nombre: "Renovación",
      precioFacturacion: "29.00",
      cicloFacturacion: "MENSUAL",
      duracion: null,
    },
  ],
});

describe("planWriteSchema", () => {
  it("acepta y normaliza un plan de pago completo", () => {
    const result = planWriteSchema.safeParse(createValidPlan());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].precioFacturacion).toBe("19.99");
    }
  });

  it("permite límites ilimitados", () => {
    const plan = createValidPlan();
    plan.valoracionesPlan = null;
    plan.captacionesPlan = null;
    expect(planWriteSchema.safeParse(plan).success).toBe(true);
  });

  it("exige duración en las fases intermedias", () => {
    const plan = createValidPlan();
    plan.items[0].duracion = null;
    const result = planWriteSchema.safeParse(plan);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["items", 0, "duracion"]);
    }
  });

  it("exige una última fase recurrente", () => {
    const plan = createValidPlan();
    plan.items[1].duracion = 1;
    const result = planWriteSchema.safeParse(plan);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["items", 1, "duracion"]);
    }
  });

  it("rechaza importes negativos o con más de dos decimales", () => {
    const negative = createValidPlan();
    negative.precio = "-1";
    const excessiveDecimals = createValidPlan();
    excessiveDecimals.precio = "29.999";
    expect(planWriteSchema.safeParse(negative).success).toBe(false);
    expect(planWriteSchema.safeParse(excessiveDecimals).success).toBe(false);
  });

  it("rechaza un plan de pago sin ningún cobro", () => {
    const plan = createValidPlan();
    plan.precio = "0";
    plan.items.forEach((item) => {
      item.precioFacturacion = "0";
    });
    const result = planWriteSchema.safeParse(plan);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["precio"]);
    }
  });

  it("rechaza propiedades desconocidas", () => {
    const plan = { ...createValidPlan(), unexpected: true };
    expect(planWriteSchema.safeParse(plan).success).toBe(false);
  });
});

describe("clonePlanValues", () => {
  it("elimina ids de fases y normaliza la última como recurrente", () => {
    const plan: PlanAdmin = {
      uuid: "964c8e63-99b4-49eb-9feb-717b0179f13e",
      nombre: "Plan mensual",
      usuarios: 3,
      valoracionesPlan: 300,
      captacionesPlan: null,
      permiteUsuarioExtra: true,
      precioPorUsuarioExtra: "2.99",
      precioPackValoracionExtra: "4.99",
      packValoracionExtra: 0,
      precio: "29",
      esFreemium: false,
      detalles: [],
      items: [
        {
          uuid: "40e81a10-ac0e-42d6-b011-0c8dea946832",
          indiceItem: 2,
          nombre: "Plan mensual",
          precioFacturacion: "29",
          cicloFacturacion: "MENSUAL",
          duracion: 2,
        },
      ],
      usage: {
        activeAssignments: 0,
        historicalAssignments: 0,
        pendingAssignments: 0,
        campaignAudiences: 0,
        campaignCards: 0,
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: null,
      deletedAt: null,
    };

    const clone = clonePlanValues(plan);
    expect(clone.nombre).toBe("Plan mensual copia");
    expect(clone.items).toEqual([
      {
        nombre: "Plan mensual",
        precioFacturacion: "29",
        cicloFacturacion: "MENSUAL",
        duracion: null,
      },
    ]);
  });
});
