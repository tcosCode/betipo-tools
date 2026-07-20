import { describe, expect, it } from "vitest";

import type { PlanAdmin } from "./plan-schema";
import {
  getPlanConfigurationIssues,
  getRecurringPhase,
  hasConfiguredCharge,
} from "./plan-business";

const createPlan = (): PlanAdmin => ({
  uuid: "964c8e63-99b4-49eb-9feb-717b0179f13e",
  nombre: "Plan mensual",
  usuarios: 3,
  valoracionesPlan: 300,
  captacionesPlan: null,
  permiteUsuarioExtra: true,
  precioPorUsuarioExtra: "2.99",
  precioPackValoracionExtra: "4.99",
  packValoracionExtra: 0,
  precio: "0",
  esFreemium: false,
  detalles: [],
  items: [
    {
      uuid: "40e81a10-ac0e-42d6-b011-0c8dea946832",
      indiceItem: 1,
      nombre: "Promoción",
      precioFacturacion: "0",
      cicloFacturacion: "MENSUAL",
      duracion: 2,
    },
    {
      uuid: "dcf07e41-4e4c-4355-9217-5f7ddf2455fe",
      indiceItem: 2,
      nombre: "Renovación",
      precioFacturacion: "29",
      cicloFacturacion: "MENSUAL",
      duracion: null,
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
});

describe("plan business status", () => {
  it("distingue el cobro inicial de la renovación", () => {
    const plan = createPlan();
    expect(hasConfiguredCharge(plan)).toBe(true);
    expect(getRecurringPhase(plan)?.precioFacturacion).toBe("29");
    expect(getPlanConfigurationIssues(plan)).toEqual([]);
  });

  it("marca planes de pago sin ningún cobro", () => {
    const plan = createPlan();
    plan.items[1].precioFacturacion = "0";
    expect(
      getPlanConfigurationIssues(plan).map((issue) => issue.code),
    ).toContain("NO_CHARGES");
  });

  it("detecta fases inalcanzables y saltos de índices", () => {
    const plan = createPlan();
    plan.items[0].duracion = null;
    plan.items[1].indiceItem = 3;
    expect(getPlanConfigurationIssues(plan).map((issue) => issue.code)).toEqual(
      ["INVALID_INDEXES", "UNREACHABLE_PHASE"],
    );
  });

  it("no aplica reglas comerciales al freemium fijo del sistema", () => {
    const plan = createPlan();
    plan.esFreemium = true;
    plan.items = [];
    expect(getPlanConfigurationIssues(plan)).toEqual([]);
  });
});
