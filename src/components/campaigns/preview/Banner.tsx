import BoltIcon from "@mui/icons-material/Bolt";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

import type { PlanModalTemplate } from "../../../features/campaigns/campaign-schema";

interface BannerProps {
  header: PlanModalTemplate["header"];
  generalData: PlanModalTemplate["generalData"];
}

export function Banner({ header, generalData }: Readonly<BannerProps>) {
  const { banner } = header;
  if (!banner.visibility) return null;

  const bannerBg = banner.bgColor ?? generalData.primaryColor;
  const bannerTextColor = banner.primaryTextColor ?? generalData.secondaryColor;
  const chipBg = banner.bannerChip.bgColor ?? "#000000";
  const chipTextColor = banner.bannerChip.textColor ?? bannerBg;
  const secondaryTextColor = banner.secondaryText.color ?? bannerTextColor;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        width: "100%",
        height: 50,
        bgcolor: bannerBg,
        borderRadius: 1.5,
        pl: 2.5,
        pr: 6,
        py: 1,
      }}
    >
      {banner.bannerChip.visibility && (
        <Chip
          icon={<BoltIcon />}
          label={
            <Typography variant="betipoMedium18" color={chipTextColor}>
              {banner.bannerChip.text}
            </Typography>
          }
          sx={{
            flexShrink: 0,
            height: "auto",
            bgcolor: chipBg,
            py: 0.5,
            px: 1.5,
            borderRadius: "999px",
            "& .MuiChip-icon": { color: chipTextColor, fontSize: 20 },
            "& .MuiChip-label": { px: 1 },
          }}
        />
      )}
      <Typography
        component="span"
        sx={{ color: bannerTextColor, fontSize: 20, fontWeight: 500 }}
      >
        {banner.primaryText}
        {banner.secondaryText.visibility && (
          <Typography
            component="span"
            sx={{
              color: secondaryTextColor,
              fontWeight: 600,
              fontSize: 20,
              ml: 1,
            }}
          >
            {banner.secondaryText.text}
          </Typography>
        )}
      </Typography>
    </Box>
  );
}
