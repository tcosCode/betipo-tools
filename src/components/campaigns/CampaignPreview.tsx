import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWatch, type Control } from "react-hook-form";

import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";

import type {
  CampaignWriteInput,
  PlanModalTemplate,
  PlanOption,
} from "../../features/campaigns/campaign-schema";
import { campaignPreviewTheme } from "./campaignTheme";
import { CampaignPlansModal } from "./preview/CampaignPlansModal";
import { CampaignPlansView } from "./preview/CampaignPlansView";

interface CampaignPreviewProps {
  control: Control<CampaignWriteInput>;
  plans: PlanOption[];
  sidePanel?: boolean;
}

const MODAL_CONTENT_WIDTH = 1160;

function ScaledPreviewCanvas({ children }: Readonly<{ children: ReactNode }>) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ scale: 0.5, height: 520 });

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const updateDimensions = () => {
      const scale = Math.min(1, frame.clientWidth / MODAL_CONTENT_WIDTH);
      const height = canvas.offsetHeight * scale;

      setDimensions((current) =>
        Math.abs(current.scale - scale) < 0.001 &&
        Math.abs(current.height - height) < 1
          ? current
          : { scale, height },
      );
    };

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(frame);
    observer.observe(canvas);
    updateDimensions();

    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={frameRef}
      sx={{
        position: "relative",
        width: "100%",
        height: dimensions.height,
        overflow: "hidden",
      }}
    >
      <Box
        ref={canvasRef}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: MODAL_CONTENT_WIDTH,
          transform: `scale(${dimensions.scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export function CampaignPreview({
  control,
  plans,
  sidePanel = false,
}: Readonly<CampaignPreviewProps>) {
  const template = useWatch({
    control,
    name: "uiTemplate",
  }) as PlanModalTemplate;
  const deferredTemplate = useDeferredValue(template);
  const [activePlanUuid, setActivePlanUuid] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={sidePanel ? "column" : { xs: "column", md: "row" }}
          spacing={2}
          alignItems={sidePanel ? "stretch" : { md: "center" }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Preview en vivo</Typography>
            <Typography variant="body2" color="text.secondary">
              Simula el plan actual para comprobar su identificación y CTA
              deshabilitado.
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: sidePanel ? 0 : 280 }}>
            <InputLabel id="active-plan-preview-label">
              Plan actual simulado
            </InputLabel>
            <Select
              labelId="active-plan-preview-label"
              label="Plan actual simulado"
              value={activePlanUuid}
              onChange={(event) => setActivePlanUuid(event.target.value)}
            >
              <MenuItem value="">Ninguno: mostrar los tres</MenuItem>
              {plans.map((plan) => (
                <MenuItem key={plan.uuid} value={plan.uuid}>
                  {plan.nombre} · {plan.uuid.slice(0, 8)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<OpenInFullIcon />}
            onClick={() => setModalOpen(true)}
          >
            Abrir modal real
          </Button>
        </Stack>
      </Paper>

      <ThemeProvider theme={campaignPreviewTheme}>
        <Box
          sx={{
            bgcolor: "#181c1f",
            borderRadius: 2,
            p: 2.5,
            overflow: sidePanel ? "hidden" : "auto",
            minWidth: 0,
          }}
        >
          {sidePanel ? (
            <>
              <Box sx={{ display: { xs: "block", xl: "none" } }}>
                <CampaignPlansView
                  template={deferredTemplate}
                  activePlanUuid={activePlanUuid}
                />
              </Box>
              <Box sx={{ display: { xs: "none", xl: "block" } }}>
                <ScaledPreviewCanvas>
                  <CampaignPlansView
                    template={deferredTemplate}
                    activePlanUuid={activePlanUuid}
                  />
                </ScaledPreviewCanvas>
              </Box>
            </>
          ) : (
            <CampaignPlansView
              template={deferredTemplate}
              activePlanUuid={activePlanUuid}
            />
          )}
        </Box>
        <CampaignPlansModal
          template={deferredTemplate}
          activePlanUuid={activePlanUuid}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </ThemeProvider>
    </Stack>
  );
}
