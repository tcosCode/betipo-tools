import type { BillingCycle, PlanAdmin, PlanBillingItem } from "./plan-schema";

const cycleLabels: Record<BillingCycle, string> = {
  DIARIO: "día",
  SEMANAL: "semana",
  MENSUAL: "mes",
  SEMESTRAL: "semestre",
  ANUAL: "año",
};

export interface PlanConfigurationIssue {
  code:
    | "NO_CHARGES"
    | "MISSING_PHASE"
    | "INVALID_INDEXES"
    | "UNREACHABLE_PHASE"
    | "FINITE_END";
  message: string;
}

export const getCycleLabel = (cycle: BillingCycle) => cycleLabels[cycle];

export const getRecurringPhase = (
  plan: PlanAdmin,
): PlanBillingItem | undefined => plan.items.at(-1);

export const hasConfiguredCharge = (plan: PlanAdmin) =>
  Number(plan.precio) > 0 ||
  plan.items.some((item) => Number(item.precioFacturacion) > 0);

export const getPlanConfigurationIssues = (
  plan: PlanAdmin,
): PlanConfigurationIssue[] => {
  if (plan.esFreemium) return [];

  const issues: PlanConfigurationIssue[] = [];
  if (!hasConfiguredCharge(plan)) {
    issues.push({
      code: "NO_CHARGES",
      message: "No tiene ningún cobro configurado",
    });
  }
  if (plan.items.length === 0) {
    issues.push({
      code: "MISSING_PHASE",
      message: "No tiene etapas de cobro",
    });
    return issues;
  }

  const hasInvalidIndexes = plan.items.some(
    (item, index) => item.indiceItem !== index + 1,
  );
  if (hasInvalidIndexes) {
    issues.push({
      code: "INVALID_INDEXES",
      message: "La secuencia de cobros no comienza en 1 o tiene saltos",
    });
  }
  if (plan.items.slice(0, -1).some((item) => item.duracion === null)) {
    issues.push({
      code: "UNREACHABLE_PHASE",
      message: "Una etapa permanente impide alcanzar los cobros posteriores",
    });
  }
  if (plan.items.at(-1)?.duracion !== null) {
    issues.push({
      code: "FINITE_END",
      message: "La última etapa no está configurada como renovación recurrente",
    });
  }
  return issues;
};
