import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import Swal from "sweetalert2";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
  campaignToFormValues,
  createCampaignDefaults,
} from "../../features/campaigns/campaign-defaults";
import {
  campaignWriteSchema,
  type CampaignAdmin,
  type CampaignWriteInput,
  type PlanOption,
} from "../../features/campaigns/campaign-schema";
import { getErrorMessage } from "../../utils/errors";
import { CampaignCardEditor } from "./CampaignCardEditor";
import { CampaignFooterEditor } from "./CampaignFooterEditor";
import { CampaignSwitch, CampaignTextField } from "./CampaignFormFields";
import { CampaignPreview } from "./CampaignPreview";

interface CampaignEditorProps {
  campaign: CampaignAdmin | null;
  plans: PlanOption[];
  onCancel: () => void;
  onSave: (input: CampaignWriteInput) => Promise<void>;
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

export function CampaignEditor({
  campaign,
  plans,
  onCancel,
  onSave,
}: Readonly<CampaignEditorProps>) {
  const methods = useForm<CampaignWriteInput>({
    resolver: zodResolver(campaignWriteSchema),
    defaultValues: campaign
      ? campaignToFormValues(campaign, plans)
      : createCampaignDefaults(),
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = methods;
  const [isFallback, setIsFallback] = useState(
    campaign ? campaign.idsPlanesAplicables.length === 0 : false,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const closeEditor = async () => {
    if (!isDirty) {
      onCancel();
      return;
    }

    const result = await Swal.fire({
      title: "¿Descartar cambios?",
      text: "Los cambios realizados en la campaña no se guardarán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, descartar",
      cancelButtonText: "Continuar editando",
    });

    if (result.isConfirmed) {
      onCancel();
    }
  };

  const submit = handleSubmit(
    async (input) => {
      if (!isFallback && input.idsPlanesAplicables.length === 0) {
        setError("idsPlanesAplicables", {
          type: "manual",
          message:
            "Selecciona al menos un plan o marca la campaña como fallback",
        });
        return;
      }

      setValidationError(null);
      setSaveError(null);
      try {
        await onSave(input);
      } catch (error) {
        setSaveError(getErrorMessage(error, "No se pudo guardar la campaña"));
      }
    },
    () => {
      setValidationError(
        "Hay campos incompletos o inválidos. Revisa las secciones marcadas antes de guardar.",
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
                  {campaign ? `Editar ${campaign.nombre}` : "Nueva campaña"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Los cambios permanecen en borrador hasta pulsar Guardar.
                  Entorno: DEV.
                </Typography>
              </Box>
              <Chip label="SOLO DEV" color="warning" variant="outlined" />
              <Button
                type="submit"
                variant="contained"
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={isSubmitting}
              >
                Guardar campaña
              </Button>
            </Stack>
          </Paper>

          {saveError && <Alert severity="error">{saveError}</Alert>}
          {validationError && <Alert severity="error">{validationError}</Alert>}
          {errors.root?.message && (
            <Alert severity="error">{errors.root.message}</Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                xl: "minmax(0, 1fr) minmax(480px, 0.95fr)",
              },
              gap: 3,
              alignItems: "start",
            }}
          >
            <Stack spacing={3} sx={{ minWidth: 0 }}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <SectionTitle
                    title="Identidad y audiencia"
                    subtitle="Define quién recibe la campaña. Una audiencia vacía se reserva al fallback."
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2.5}>
                    <CampaignTextField
                      control={control}
                      name="nombre"
                      label="Nombre interno"
                      fullWidth
                    />
                    <FormControlLabel
                      label="Campaña fallback para planes sin campaña específica"
                      control={
                        <Switch
                          checked={isFallback}
                          onChange={(_, checked) => {
                            setIsFallback(checked);
                            if (checked) {
                              setValue("idsPlanesAplicables", [], {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }
                          }}
                        />
                      }
                    />
                    {isFallback && (
                      <Alert severity="warning">
                        Solo puede existir una campaña fallback activa. El
                        backend debe resolverla únicamente cuando no haya una
                        campaña específica.
                      </Alert>
                    )}
                    <Controller
                      control={control}
                      name="idsPlanesAplicables"
                      render={({ field, fieldState }) => {
                        const selectedPlans = field.value.map(
                          (uuid) =>
                            plans.find((plan) => plan.uuid === uuid) ?? {
                              uuid,
                              nombre: "Plan no encontrado",
                              precio: "-",
                              esFreemium: false,
                            },
                        );
                        return (
                          <Autocomplete
                            multiple
                            disabled={isFallback}
                            options={plans}
                            value={selectedPlans}
                            isOptionEqualToValue={(option, value) =>
                              option.uuid === value.uuid
                            }
                            getOptionLabel={(option) =>
                              `${option.nombre} · ${option.uuid.slice(0, 8)}`
                            }
                            onChange={(_, value) =>
                              field.onChange(value.map((plan) => plan.uuid))
                            }
                            renderTags={(value, getTagProps) =>
                              value.map((plan, index) => (
                                <Chip
                                  {...getTagProps({ index })}
                                  key={plan.uuid}
                                  color={
                                    plan.nombre === "Plan no encontrado"
                                      ? "warning"
                                      : "default"
                                  }
                                  label={`${plan.nombre} · ${plan.uuid.slice(0, 8)}`}
                                />
                              ))
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Planes de la audiencia"
                                error={Boolean(fieldState.error)}
                                helperText={
                                  fieldState.error?.message ??
                                  "Estos son los planes que pagan actualmente los usuarios objetivo"
                                }
                              />
                            )}
                          />
                        );
                      }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <SectionTitle
                    title="Apariencia y banner"
                    subtitle="Los colores se aplican al banner, chips, botones y plan destacado."
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2.5}>
                    <CampaignSwitch
                      control={control}
                      name="uiTemplate.generalData.showOnLogin"
                      label="Abrir automáticamente al iniciar sesión"
                    />
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <CampaignTextField
                        control={control}
                        name="uiTemplate.generalData.primaryColor"
                        label="Color principal"
                        type="color"
                        fullWidth
                      />
                      <CampaignTextField
                        control={control}
                        name="uiTemplate.generalData.secondaryColor"
                        label="Color de contraste"
                        type="color"
                        fullWidth
                      />
                    </Stack>
                    <CampaignSwitch
                      control={control}
                      name="uiTemplate.header.banner.visibility"
                      label="Mostrar banner"
                    />
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <CampaignTextField
                        control={control}
                        name="uiTemplate.header.banner.primaryText"
                        label="Texto principal"
                        fullWidth
                      />
                      <CampaignTextField
                        control={control}
                        name="uiTemplate.header.banner.bgColor"
                        label="Fondo"
                        type="color"
                        sx={{ minWidth: 130 }}
                      />
                      <CampaignTextField
                        control={control}
                        name="uiTemplate.header.banner.primaryTextColor"
                        label="Texto"
                        type="color"
                        sx={{ minWidth: 130 }}
                      />
                    </Stack>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      alignItems={{ md: "center" }}
                    >
                      <CampaignSwitch
                        control={control}
                        name="uiTemplate.header.banner.secondaryText.visibility"
                        label="Texto secundario"
                      />
                      <CampaignTextField
                        control={control}
                        name="uiTemplate.header.banner.secondaryText.text"
                        label="Contenido"
                        fullWidth
                      />
                      <CampaignTextField
                        control={control}
                        name="uiTemplate.header.banner.secondaryText.color"
                        label="Color"
                        type="color"
                        sx={{ minWidth: 130 }}
                      />
                    </Stack>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      alignItems={{ md: "center" }}
                    >
                      <CampaignSwitch
                        control={control}
                        name="uiTemplate.header.banner.bannerChip.visibility"
                        label="Chip del banner"
                      />
                      <CampaignTextField
                        control={control}
                        name="uiTemplate.header.banner.bannerChip.text"
                        label="Texto del chip"
                        fullWidth
                      />
                      <CampaignTextField
                        control={control}
                        name="uiTemplate.header.banner.bannerChip.bgColor"
                        label="Fondo"
                        type="color"
                        sx={{ minWidth: 130 }}
                      />
                      <CampaignTextField
                        control={control}
                        name="uiTemplate.header.banner.bannerChip.textColor"
                        label="Texto"
                        type="color"
                        sx={{ minWidth: 130 }}
                      />
                    </Stack>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <SectionTitle
                    title="Tres planes ofrecidos"
                    subtitle="El precio se obtiene de la tabla planes; el copy comercial es editable."
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    {errors.uiTemplate?.cards?.message && (
                      <Alert severity="error">
                        {errors.uiTemplate.cards.message}
                      </Alert>
                    )}
                    {[0, 1, 2].map((index) => (
                      <CampaignCardEditor
                        key={index}
                        index={index}
                        control={control}
                        setValue={setValue}
                        plans={plans}
                      />
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <SectionTitle
                    title="Footer"
                    subtitle="Configura las prestaciones comunes que se despliegan bajo las tarjetas."
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <CampaignFooterEditor control={control} />
                </AccordionDetails>
              </Accordion>
            </Stack>

            <Box
              component="aside"
              sx={{
                minWidth: 0,
                position: { xl: "sticky" },
                top: { xl: 112 },
                maxHeight: { xl: "calc(100dvh - 128px)" },
                overflowY: { xl: "auto" },
                pr: { xl: 0.5 },
              }}
            >
              <CampaignPreview control={control} plans={plans} sidePanel />
            </Box>
          </Box>
        </Stack>
      </Box>
    </FormProvider>
  );
}
