import { Fragment, useEffect, useState } from "react";
import Swal from "sweetalert2";

import AddIcon from "@mui/icons-material/Add";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import ScopedCssBaseline from "@mui/material/ScopedCssBaseline";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";

import { createPlan, fetchPlans } from "../../features/plans/plan-api";
import {
  getCycleLabel,
  getPlanConfigurationIssues,
  getRecurringPhase,
  hasConfiguredCharge,
} from "../../features/plans/plan-business";
import {
  clonePlanValues,
  createPlanDefaults,
  formatMoney,
} from "../../features/plans/plan-defaults";
import type {
  PlanAdmin,
  PlanWriteInput,
} from "../../features/plans/plan-schema";
import { getErrorMessage } from "../../utils/errors";
import { toolTheme } from "../campaigns/campaignTheme";
import { PlanEditor } from "./PlanEditor";

interface EditorState {
  values: PlanWriteInput;
  sourceName?: string;
}

const formatLimit = (value: number | null) =>
  value === null ? "Sin límite" : new Intl.NumberFormat("es-ES").format(value);

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

function BillingSummary({ plan }: Readonly<{ plan: PlanAdmin }>) {
  const recurringPhase = getRecurringPhase(plan);
  const configuredCharge = hasConfiguredCharge(plan);

  return (
    <Stack
      spacing={0.75}
      sx={{ minWidth: 190, fontVariantNumeric: "tabular-nums" }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          Cobro al contratar:
        </Typography>
        <Typography
          component={"span"}
          variant="subtitle1"
          fontSize={14}
          fontWeight={700}
        >
          {formatMoney(plan.precio)} €
        </Typography>
      </Stack>
      {recurringPhase && (
        <Typography variant="body2">
          {recurringPhase.duracion === null ? "Renovación" : "Última etapa"}:{" "}
          <strong>{formatMoney(recurringPhase.precioFacturacion)} €</strong>/
          {getCycleLabel(recurringPhase.cicloFacturacion)}
        </Typography>
      )}
      {plan.items.length > 1 && (
        <Typography variant="caption" color="text.secondary">
          {pluralize(plan.items.length, "etapa de cobro", "etapas de cobro")}
        </Typography>
      )}
      {!configuredCharge && !plan.esFreemium && (
        <Chip size="small" color="error" label="Sin cobros configurados" />
      )}
    </Stack>
  );
}

function CustomerUsage({ plan }: Readonly<{ plan: PlanAdmin }>) {
  return (
    <Stack
      spacing={0.75}
      sx={{ minWidth: 180, fontVariantNumeric: "tabular-nums" }}
    >
      {plan.usage.activeAssignments > 0 ? (
        <Box>
          <Typography variant="subtitle2" color="primary.main">
            {pluralize(
              plan.usage.activeAssignments,
              "inmobiliaria activa",
              "inmobiliarias activas",
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            usan este plan actualmente
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Ninguna inmobiliaria activa
        </Typography>
      )}
      {plan.usage.pendingAssignments > 0 && (
        <Chip
          size="small"
          color="warning"
          variant="outlined"
          label={pluralize(
            plan.usage.pendingAssignments,
            "cambio programado",
            "cambios programados",
          )}
        />
      )}
      {plan.usage.historicalAssignments > 0 && (
        <Typography variant="caption" color="text.secondary">
          {pluralize(
            plan.usage.historicalAssignments,
            "asignación histórica",
            "asignaciones históricas",
          )}
        </Typography>
      )}
    </Stack>
  );
}

function CampaignUsage({ plan }: Readonly<{ plan: PlanAdmin }>) {
  const hasCampaignUsage =
    plan.usage.campaignCards > 0 || plan.usage.campaignAudiences > 0;

  if (!hasCampaignUsage) {
    return (
      <Typography variant="body2" color="text.secondary">
        No aparece en campañas
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75} alignItems="flex-start" sx={{ minWidth: 165 }}>
      {plan.usage.campaignCards > 0 && (
        <Chip
          size="small"
          color="success"
          label={`Ofrecido en ${pluralize(plan.usage.campaignCards, "campaña", "campañas")}`}
        />
      )}
      {plan.usage.campaignAudiences > 0 && (
        <Chip
          size="small"
          color="info"
          variant="outlined"
          label={`Audiencia de ${pluralize(plan.usage.campaignAudiences, "campaña", "campañas")}`}
        />
      )}
    </Stack>
  );
}

function PlanExpandedRow({ plan }: Readonly<{ plan: PlanAdmin }>) {
  const issues = getPlanConfigurationIssues(plan);
  return (
    <Stack spacing={2.5} sx={{ py: 2 }}>
      {issues.length > 0 && (
        <Alert severity="warning" variant="outlined">
          <AlertTitle>Configuración histórica que requiere revisión</AlertTitle>
          {issues.map((issue) => (
            <Typography key={issue.code} variant="body2">
              · {issue.message}
            </Typography>
          ))}
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" },
          gap: 3,
        }}
      >
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Límites & extras
          </Typography>
          <Typography variant="body2">Usuarios: {plan.usuarios}</Typography>
          <Typography variant="body2">
            Valoraciones: {formatLimit(plan.valoracionesPlan)}
          </Typography>
          <Typography variant="body2">
            Captaciones: {formatLimit(plan.captacionesPlan)}
          </Typography>
          <Typography variant="body2">
            Usuario extra:{" "}
            {plan.permiteUsuarioExtra
              ? `${formatMoney(plan.precioPorUsuarioExtra)} €`
              : "No permitido"}
          </Typography>
          <Typography variant="body2">
            Pack: {plan.packValoracionExtra} por{" "}
            {formatMoney(plan.precioPackValoracionExtra)} €
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Etapas de cobro
          </Typography>
          <Stack spacing={1}>
            {plan.items.map((item, index) => (
              <Box key={item.uuid}>
                <Typography variant="body2" fontWeight={600}>
                  {index + 1}. {item.nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatMoney(item.precioFacturacion)} €/
                  {getCycleLabel(item.cicloFacturacion)} ·{" "}
                  {item.duracion === null
                    ? "sin fecha de fin"
                    : `durante ${pluralize(item.duracion, "ciclo", "ciclos")}`}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Prestaciones
          </Typography>
          {plan.detalles.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin prestaciones configuradas
            </Typography>
          ) : (
            <Stack spacing={0.75}>
              {plan.detalles.map((detail) => (
                <Typography
                  key={`${detail.key}-${detail.text}`}
                  variant="body2"
                >
                  · {detail.text}
                </Typography>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Stack>
  );
}

export default function PlansTab() {
  const [plans, setPlans] = useState<PlanAdmin[]>([]);
  const [editor, setEditor] = useState<EditorState>();
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    fetchPlans(controller.signal)
      .then(setPlans)
      .catch((loadError: unknown) => {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        )
          return;
        setError(
          getErrorMessage(loadError, "No se pudieron cargar los planes"),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const handleSave = async (input: PlanWriteInput) => {
    const saved = await createPlan(input);
    setPlans((current) =>
      [...current, saved].sort((first, second) =>
        first.nombre.localeCompare(second.nombre, "es", {
          sensitivity: "base",
        }),
      ),
    );
    setEditor(undefined);
    await Swal.fire({
      icon: "success",
      title: "Plan creado",
      text: `${saved.nombre} ya está disponible en el selector de planes de Campañas. UUID: ${saved.uuid}`,
      confirmButtonText: "Entendido",
    });
  };

  const plansRequiringReview = plans.filter(
    (plan) => getPlanConfigurationIssues(plan).length > 0,
  );

  return (
    <ThemeProvider theme={toolTheme}>
      <ScopedCssBaseline sx={{ bgcolor: "transparent" }}>
        {editor ? (
          <PlanEditor
            defaultValues={editor.values}
            sourceName={editor.sourceName}
            onCancel={() => setEditor(undefined)}
            onSave={handleSave}
          />
        ) : (
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ md: "center" }}
              >
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <PaymentsOutlinedIcon color="primary" fontSize="large" />
                    <Typography variant="h4" fontWeight={700}>
                      Planes maestros
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Consulta la configuración actual y crea planes de pago para
                    usarlos en campañas.
                  </Typography>
                </Box>
                <Chip label="ENTORNO DEV" color="warning" variant="outlined" />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={isLoading}
                  onClick={() => setEditor({ values: createPlanDefaults() })}
                >
                  Nuevo plan
                </Button>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Cómo leer este catálogo
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                  gap: 2,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <ReceiptLongOutlinedIcon color="primary" aria-hidden="true" />
                  <Box>
                    <Typography variant="subtitle2">Facturación</Typography>
                    <Typography variant="body2" color="text.secondary">
                      “Cobro al contratar” es el pago de alta. “Renovación” es
                      el cobro periódico de la última etapa.
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <GroupsOutlinedIcon color="primary" aria-hidden="true" />
                  <Box>
                    <Typography variant="subtitle2">Clientes</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Separa inmobiliarias que ya usan el plan de cambios
                      programados para una renovación futura.
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <CampaignOutlinedIcon color="primary" aria-hidden="true" />
                  <Box>
                    <Typography variant="subtitle2">Campañas</Typography>
                    <Typography variant="body2" color="text.secondary">
                      “Ofrecido” significa que el cliente puede contratarlo.
                      “Audiencia” indica a quién se muestra una campaña.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Paper>
            {plansRequiringReview.length > 0 && !isLoading && (
              <Alert severity="warning" variant="outlined">
                <AlertTitle>
                  {pluralize(
                    plansRequiringReview.length,
                    "plan histórico requiere revisión",
                    "planes históricos requieren revisión",
                  )}
                </AlertTitle>
                Están marcados en la tabla porque no tienen cobros o su
                secuencia de facturación no coincide con el comportamiento
                actual del backend. Puedes abrirlos para ver el motivo exacto.
              </Alert>
            )}
            {error && (
              <Alert
                severity="error"
                action={
                  <Button
                    onClick={() => setReloadKey((current) => current + 1)}
                  >
                    Reintentar
                  </Button>
                }
              >
                {error}
              </Alert>
            )}

            {isLoading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table
                  aria-label="Planes maestros activos"
                  sx={{ minWidth: 1280 }}
                >
                  <Box
                    component="caption"
                    sx={{
                      position: "absolute",
                      width: 1,
                      height: 1,
                      p: 0,
                      m: -1,
                      overflow: "hidden",
                      clip: "rect(0, 0, 0, 0)",
                      whiteSpace: "nowrap",
                      border: 0,
                    }}
                  >
                    Catálogo de planes maestros con facturación, clientes y
                    presencia en campañas
                  </Box>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell>Plan</TableCell>
                      <TableCell>Facturación</TableCell>
                      <TableCell>Clientes</TableCell>
                      <TableCell>Campañas</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {plans.map((plan) => {
                      const expanded = expandedUuid === plan.uuid;
                      const issues = getPlanConfigurationIssues(plan);
                      return (
                        <Fragment key={plan.uuid}>
                          <TableRow hover>
                            <TableCell padding="checkbox">
                              <IconButton
                                size="small"
                                aria-controls={`plan-details-${plan.uuid}`}
                                aria-expanded={expanded}
                                aria-label={
                                  expanded
                                    ? `Ocultar detalles de ${plan.nombre}`
                                    : `Mostrar detalles de ${plan.nombre}`
                                }
                                onClick={() =>
                                  setExpandedUuid(expanded ? null : plan.uuid)
                                }
                              >
                                {expanded ? (
                                  <ExpandLessIcon />
                                ) : (
                                  <ExpandMoreIcon />
                                )}
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
                                  <Typography fontWeight={700}>
                                    {plan.nombre}
                                  </Typography>
                                  {plan.esFreemium && (
                                    <Chip
                                      size="small"
                                      color="info"
                                      variant="outlined"
                                      label="Gestionado por el sistema"
                                    />
                                  )}
                                  {issues.length > 0 && (
                                    <Chip
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                      label="Requiere revisión"
                                    />
                                  )}
                                </Stack>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {plan.uuid}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <BillingSummary plan={plan} />
                            </TableCell>
                            <TableCell>
                              <CustomerUsage plan={plan} />
                            </TableCell>
                            <TableCell>
                              <CampaignUsage plan={plan} />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip
                                describeChild
                                title={
                                  plan.esFreemium
                                    ? "El backend gestiona Freemium mediante un UUID fijo"
                                    : issues.length > 0
                                      ? "Abrir una copia y corregir las alertas antes de crearla"
                                      : "Crear un nuevo plan usando esta configuración"
                                }
                              >
                                <span>
                                  <Button
                                    size="small"
                                    startIcon={<ContentCopyIcon />}
                                    disabled={plan.esFreemium}
                                    onClick={() =>
                                      setEditor({
                                        values: clonePlanValues(plan),
                                        sourceName: plan.nombre,
                                      })
                                    }
                                  >
                                    {issues.length > 0
                                      ? "Revisar y usar"
                                      : "Usar como base"}
                                  </Button>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ py: 0 }} colSpan={6}>
                              <Collapse
                                id={`plan-details-${plan.uuid}`}
                                in={expanded}
                                timeout="auto"
                                unmountOnExit
                              >
                                <PlanExpandedRow plan={plan} />
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        )}
      </ScopedCssBaseline>
    </ThemeProvider>
  );
}
