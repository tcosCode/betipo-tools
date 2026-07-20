import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import Swal from "sweetalert2";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  planWriteSchema,
  type PlanWriteInput,
} from "../../features/plans/plan-schema";
import { getErrorMessage } from "../../utils/errors";
import { PlanBillingItemsEditor } from "./PlanBillingItemsEditor";
import { PlanDetailsEditor } from "./PlanDetailsEditor";

interface PlanEditorProps {
  defaultValues: PlanWriteInput;
  sourceName?: string;
  onCancel: () => void;
  onSave: (input: PlanWriteInput) => Promise<void>;
}

const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <Box>
    <Typography variant="h6">{title}</Typography>
    <Typography variant="body2" color="text.secondary">
      {subtitle}
    </Typography>
  </Box>
);

function NullableLimitField({
  name,
  label,
  control,
  setValue,
}: {
  name: "valoracionesPlan" | "captacionesPlan";
  label: string;
  control: Control<PlanWriteInput>;
  setValue: UseFormSetValue<PlanWriteInput>;
}) {
  const value = useWatch({ control, name });
  const unlimited = value === null;

  return (
    <Stack spacing={1}>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <TextField
            id={`plan-${name}`}
            label={label}
            type="number"
            disabled={unlimited}
            value={field.value ?? ""}
            onBlur={field.onBlur}
            onChange={(event) =>
              field.onChange(
                event.target.value === ""
                  ? Number.NaN
                  : Number(event.target.value),
              )
            }
            error={Boolean(fieldState.error)}
            helperText={
              fieldState.error?.message ??
              (unlimited ? "Sin límite" : "Por ciclo")
            }
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
          />
        )}
      />
      <FormControlLabel
        label="Sin límite"
        control={
          <Switch
            checked={unlimited}
            onChange={(_, checked) =>
              setValue(name, checked ? null : 1, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        }
      />
    </Stack>
  );
}

export function PlanEditor({
  defaultValues,
  sourceName,
  onCancel,
  onSave,
}: Readonly<PlanEditorProps>) {
  const methods = useForm<PlanWriteInput>({
    resolver: zodResolver(planWriteSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });
  const {
    control,
    getValues,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = methods;
  const allowsExtraUsers = useWatch({ control, name: "permiteUsuarioExtra" });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const closeEditor = async () => {
    if (!isDirty) {
      onCancel();
      return;
    }
    const result = await Swal.fire({
      title: "¿Descartar el nuevo plan?",
      text: "La configuración aún no se ha guardado en la base de datos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, descartar",
      cancelButtonText: "Continuar editando",
    });
    if (result.isConfirmed) onCancel();
  };

  const submit = handleSubmit(
    async (input) => {
      setValidationError(null);
      setSaveError(null);
      const confirmation = await Swal.fire({
        title: `¿Crear ${input.nombre}?`,
        text: `Se creará con ${input.items.length} etapa${input.items.length === 1 ? "" : "s"} de cobro y quedará disponible inmediatamente para las campañas de DEV.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Crear plan",
        cancelButtonText: "Revisar",
      });
      if (!confirmation.isConfirmed) return;

      try {
        await onSave(input);
      } catch (error) {
        setSaveError(getErrorMessage(error, "No se pudo crear el plan"));
      }
    },
    () => {
      setValidationError(
        "Hay campos incompletos o etapas de cobro inválidas. Revisa las secciones antes de crear el plan.",
      );
    },
  );

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={submit} noValidate>
        <Stack spacing={3}>
          <Paper
            variant="outlined"
            sx={{ p: 2.5, position: "sticky", top: 8, zIndex: 5 }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ md: "center" }}
            >
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => void closeEditor()}
              >
                Volver
              </Button>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={700}>
                  Nuevo plan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sourceName ? `Basado en ${sourceName}. ` : ""}No se guardará
                  hasta confirmar la creación.
                </Typography>
              </Box>
              <Chip label="SOLO DEV" color="warning" variant="outlined" />
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
              >
                Crear plan
              </Button>
            </Stack>
          </Paper>

          <Alert severity="warning">
            Esta herramienta no edita ni elimina planes. Revisa especialmente el
            precio inicial y el calendario de cobros antes de confirmar.
          </Alert>
          {saveError && <Alert severity="error">{saveError}</Alert>}
          {validationError && <Alert severity="error">{validationError}</Alert>}
          {errors.root?.message && (
            <Alert severity="error">{errors.root.message}</Alert>
          )}

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SectionTitle
                title="Identidad y checkout"
                subtitle="El precio inicial es el importe que Redsys cobra al contratar el plan."
              />
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
                  gap: 2,
                }}
              >
                <Controller
                  control={control}
                  name="nombre"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="plan-name"
                      label="Nombre interno"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="precio"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="plan-checkout-price"
                      label="Precio inicial"
                      inputMode="decimal"
                      error={Boolean(fieldState.error)}
                      helperText={
                        fieldState.error?.message ?? "Importe sin IVA"
                      }
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">€</InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SectionTitle
                title="Límites y extras"
                subtitle="Valores que se copiarán a la inmobiliaria cuando contrate el plan."
              />
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 2,
                  }}
                >
                  <Controller
                    control={control}
                    name="usuarios"
                    render={({ field, fieldState }) => (
                      <TextField
                        id="plan-users"
                        label="Usuarios incluidos"
                        type="number"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ""
                              ? Number.NaN
                              : Number(event.target.value),
                          )
                        }
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                        slotProps={{ htmlInput: { min: 1, step: 1 } }}
                      />
                    )}
                  />
                  <NullableLimitField
                    name="valoracionesPlan"
                    label="Valoraciones"
                    control={control}
                    setValue={setValue}
                  />
                  <NullableLimitField
                    name="captacionesPlan"
                    label="Captaciones"
                    control={control}
                    setValue={setValue}
                  />
                </Box>
                <FormControlLabel
                  label="Permitir usuarios adicionales"
                  control={
                    <Controller
                      control={control}
                      name="permiteUsuarioExtra"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                        />
                      )}
                    />
                  }
                />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 2,
                  }}
                >
                  <Controller
                    control={control}
                    name="precioPorUsuarioExtra"
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="plan-extra-user-price"
                        label="Precio por usuario extra"
                        inputMode="decimal"
                        disabled={!allowsExtraUsers}
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">€</InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="packValoracionExtra"
                    render={({ field, fieldState }) => (
                      <TextField
                        id="plan-extra-pack-size"
                        label="Valoraciones por pack"
                        type="number"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ""
                              ? Number.NaN
                              : Number(event.target.value),
                          )
                        }
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="precioPackValoracionExtra"
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id="plan-extra-pack-price"
                        label="Precio del pack"
                        inputMode="decimal"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">€</InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SectionTitle
                title="Prestaciones"
                subtitle="Descripción funcional del plan que se copia a la cuenta contratante."
              />
            </AccordionSummary>
            <AccordionDetails>
              <PlanDetailsEditor control={control} />
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SectionTitle
                title="Calendario de cobros"
                subtitle="Define promociones temporales y la renovación que continuará hasta cancelar."
              />
            </AccordionSummary>
            <AccordionDetails>
              <PlanBillingItemsEditor
                control={control}
                getValues={getValues}
                setValue={setValue}
              />
            </AccordionDetails>
          </Accordion>
        </Stack>
      </Box>
    </FormProvider>
  );
}
