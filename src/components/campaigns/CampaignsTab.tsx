import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import AddIcon from "@mui/icons-material/Add";
import CampaignIcon from "@mui/icons-material/Campaign";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import ScopedCssBaseline from "@mui/material/ScopedCssBaseline";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";

import {
  fetchCampaignPlanOptions,
  fetchCampaigns,
  saveCampaign,
} from "../../features/campaigns/campaign-api";
import type {
  CampaignAdmin,
  CampaignWriteInput,
  PlanOption,
} from "../../features/campaigns/campaign-schema";
import { getErrorMessage } from "../../utils/errors";
import { CampaignEditor } from "./CampaignEditor";
import { toolTheme } from "./campaignTheme";

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<CampaignAdmin[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<
    CampaignAdmin | null | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchCampaigns(controller.signal),
      fetchCampaignPlanOptions(controller.signal),
    ])
      .then(([campaignData, planData]) => {
        setCampaigns(campaignData);
        setPlans(planData);
      })
      .catch((loadError: unknown) => {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        )
          return;
        setError(
          getErrorMessage(loadError, "No se pudieron cargar las campañas"),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const handleSave = async (input: CampaignWriteInput) => {
    const saved = await saveCampaign(input, editingCampaign?.uuid);
    setCampaigns((current) => {
      const exists = current.some((campaign) => campaign.uuid === saved.uuid);
      return exists
        ? current.map((campaign) =>
            campaign.uuid === saved.uuid ? saved : campaign,
          )
        : [...current, saved].sort((first, second) =>
            first.nombre.localeCompare(second.nombre),
          );
    });
    setEditingCampaign(undefined);
    await Swal.fire({
      icon: "success",
      title: editingCampaign ? "Campaña actualizada" : "Campaña creada",
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const plansByUuid = new Map(plans.map((plan) => [plan.uuid, plan]));
  const hasFallback = campaigns.some(
    (campaign) => campaign.idsPlanesAplicables.length === 0,
  );

  return (
    <ThemeProvider theme={toolTheme}>
      <ScopedCssBaseline sx={{ bgcolor: "transparent" }}>
        {editingCampaign !== undefined ? (
          <CampaignEditor
            key={editingCampaign?.uuid ?? "new"}
            campaign={editingCampaign}
            plans={plans}
            onCancel={() => setEditingCampaign(undefined)}
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
                    <CampaignIcon color="primary" fontSize="large" />
                    <Typography variant="h4" fontWeight={700}>
                      Campañas de planes
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Configura audiencias, tres planes destino y la visualización
                    del modal.
                  </Typography>
                </Box>
                <Chip label="ENTORNO DEV" color="warning" variant="outlined" />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={plans.length < 3}
                  onClick={() => setEditingCampaign(null)}
                >
                  Nueva campaña
                </Button>
              </Stack>
            </Paper>

            {!hasFallback && !isLoading && (
              <Alert severity="warning">
                No existe una campaña fallback. Los planes fuera de las
                audiencias configuradas no tienen una campaña determinista.
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
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 2.5,
                }}
              >
                {campaigns.map((campaign) => (
                  <Paper key={campaign.uuid} variant="outlined" sx={{ p: 2.5 }}>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={700}>
                            {campaign.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {campaign.uuid}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          color={
                            campaign.idsPlanesAplicables.length === 0
                              ? "warning"
                              : "primary"
                          }
                          label={
                            campaign.idsPlanesAplicables.length === 0
                              ? "Fallback"
                              : `${campaign.idsPlanesAplicables.length} planes en audiencia`
                          }
                        />
                      </Stack>

                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Planes ofrecidos
                        </Typography>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                          {campaign.uiTemplate.cards.map((card) => {
                            const plan = plansByUuid.get(card.planUuid);
                            return (
                              <Chip
                                key={card.planUuid}
                                size="small"
                                color={plan ? "default" : "warning"}
                                label={
                                  plan?.nombre ??
                                  `No encontrado · ${card.planUuid.slice(0, 8)}`
                                }
                              />
                            );
                          })}
                        </Stack>
                      </Box>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body2" color="text.secondary">
                          {campaign.uiTemplate.generalData.showOnLogin
                            ? "Apertura automática activada"
                            : "Apertura automática desactivada"}
                        </Typography>
                        <Button
                          startIcon={<EditOutlinedIcon />}
                          onClick={() => setEditingCampaign(campaign)}
                        >
                          Editar
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Box>
            )}
          </Stack>
        )}
      </ScopedCssBaseline>
    </ThemeProvider>
  );
}
