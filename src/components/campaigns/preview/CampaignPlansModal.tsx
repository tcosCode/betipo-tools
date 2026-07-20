import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import SvgIcon from "@mui/material/SvgIcon";

import type { PlanModalTemplate } from "../../../features/campaigns/campaign-schema";
import { CampaignPlansView } from "./CampaignPlansView";

interface CampaignPlansModalProps {
  template: PlanModalTemplate;
  activePlanUuid?: string;
  open: boolean;
  onClose: () => void;
}

export function CampaignPlansModal({
  template,
  activePlanUuid,
  open,
  onClose,
}: Readonly<CampaignPlansModalProps>) {
  const { banner } = template.header;
  const closeColor = banner.visibility
    ? (banner.primaryTextColor ?? template.generalData.secondaryColor)
    : "#fff";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-label="Planes Betipo"
      slotProps={{ paper: { sx: { position: "relative", p: 2.5 } } }}
    >
      <ButtonBase
        onClick={onClose}
        disableRipple
        aria-label="Cerrar preview"
        sx={{
          position: "absolute",
          top: 30,
          right: 30,
          p: 0.5,
          zIndex: 1,
          color: closeColor,
        }}
      >
        <SvgIcon sx={{ fontSize: 24 }} viewBox="0 0 24 24">
          <path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" />
        </SvgIcon>
      </ButtonBase>
      <CampaignPlansView template={template} activePlanUuid={activePlanUuid} />
    </Dialog>
  );
}
