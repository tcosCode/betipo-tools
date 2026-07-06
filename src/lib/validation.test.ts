import { describe, expect, it } from "vitest";

import { formationInputSchema, maintenanceInputSchema } from "./validation";

const validFormation = {
  asunto: "Curso de prueba",
  entidad: "Betipo",
  descripcion: "Descripcion",
  fecha_inicio: "2026-01-30T15:10:00.000Z",
  fecha_fin: "2026-01-30T16:10:00.000Z",
  enlace: "",
  oculta: false,
};

describe("formationInputSchema", () => {
  it("accepts valid formation input", () => {
    expect(formationInputSchema.safeParse(validFormation).success).toBe(true);
  });

  it("rejects empty required strings", () => {
    expect(
      formationInputSchema.safeParse({
        ...validFormation,
        asunto: "",
      }).success,
    ).toBe(false);
  });

  it("rejects non-boolean visibility", () => {
    expect(
      formationInputSchema.safeParse({
        ...validFormation,
        oculta: "false",
      }).success,
    ).toBe(false);
  });
});

describe("maintenanceInputSchema", () => {
  it("accepts boolean maintenance input", () => {
    expect(
      maintenanceInputSchema.safeParse({ en_mantenimiento: true }).success,
    ).toBe(true);
  });

  it("rejects non-boolean maintenance input", () => {
    expect(
      maintenanceInputSchema.safeParse({ en_mantenimiento: "true" }).success,
    ).toBe(false);
  });
});
