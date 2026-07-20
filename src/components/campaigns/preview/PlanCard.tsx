import BoltIcon from "@mui/icons-material/Bolt";
import CheckIcon from "@mui/icons-material/Check";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";

import type { PlanModalTemplate } from "../../../features/campaigns/campaign-schema";

type Card = PlanModalTemplate["cards"][number];

interface PlanCardProps {
  card: Card;
  generalData: PlanModalTemplate["generalData"];
  onSelect: (planUuid: string) => void;
  isActivePlan?: boolean;
}

const FIXED_FOOTNOTE = "* Precios sin IVA";
const ACTIVE_PLAN_TEXT = "Plan Activo";

export function PlanCard({
  card,
  generalData,
  onSelect,
  isActivePlan,
}: Readonly<PlanCardProps>) {
  const theme = useTheme();
  const { primaryColor, secondaryColor } = generalData;
  const { highlighted } = card;
  const displayPrice = card.price.text.replace(/\s*€\s*$/, "");

  return (
    <Box
      sx={{
        position: "relative",
        flex: "1 1 0",
        width: 380,
        minHeight: 460,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 3,
        pt: 4,
        borderRadius: theme.shape.borderRadius,
        border: "2px solid",
        borderColor: highlighted ? primaryColor : "grey.400",
        background: highlighted
          ? `linear-gradient(180deg, ${alpha(primaryColor, 0.18)} 0%, rgba(0, 0, 0, 0.2) 100%)`
          : "transparent",
      }}
    >
      {card.chip.visibility && (
        <Chip
          icon={highlighted ? <BoltIcon /> : undefined}
          label={card.chip.text}
          sx={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
            height: "auto",
            py: 0.5,
            px: 2,
            borderRadius: theme.spacing(1),
            bgcolor: highlighted ? primaryColor : "grey.700",
            color: highlighted ? secondaryColor : "#fff",
            fontWeight: 700,
            fontSize: 18,
            "& .MuiChip-icon": {
              color: highlighted ? secondaryColor : "#fff",
              fontSize: 18,
            },
          }}
        />
      )}

      <Stack sx={{ textAlign: highlighted ? "center" : "left", mb: 3 }}>
        <Typography
          variant="betipoMedium28"
          sx={{ color: highlighted ? primaryColor : "#fff" }}
        >
          {card.planTitle.text}
        </Typography>
        {card.planSubtitle.visibility && (
          <Typography
            component="p"
            variant="betipoMedium16"
            color={highlighted ? primaryColor : "grey.400"}
          >
            {card.planSubtitle.text}
          </Typography>
        )}
      </Stack>

      <Stack sx={{ gap: 1.5 }}>
        {card.priceDiscount.visibility && (
          <Typography
            component="p"
            variant="betipoRegular18"
            sx={{ color: "grey.300", textDecoration: "line-through" }}
          >
            {card.priceDiscount.text}
          </Typography>
        )}
        <Typography
          sx={{
            color: "#fff",
            fontWeight: 500,
            fontSize: 60,
            lineHeight: 1,
            textAlign: highlighted ? "center" : "left",
          }}
        >
          {displayPrice}
          <Typography
            component="span"
            sx={{ fontSize: 32, verticalAlign: "middle" }}
          >
            €
          </Typography>
          <Typography
            component="sup"
            sx={{
              fontSize: 20,
              fontWeight: 400,
              ml: 0.25,
              verticalAlign: "super",
            }}
          >
            *
          </Typography>
        </Typography>
        <Typography
          component="p"
          variant="betipoRegular18"
          sx={{
            color: "#fff",
            mt: 0.5,
            textAlign: highlighted ? "center" : "left",
          }}
        >
          {card.priceSubtitle.text}
        </Typography>
      </Stack>

      {card.helperIconText.visibility && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: card.helperIconText.textColor ?? "#fff",
          }}
        >
          <TrendingDownIcon sx={{ fontSize: 20 }} />
          <Typography variant="betipoMedium18" sx={{ color: "inherit" }}>
            {card.helperIconText.text}
          </Typography>
        </Box>
      )}
      {card.helperText.visibility && (
        <Typography variant="betipoRegular18" sx={{ color: "grey.300" }}>
          {card.helperText.text}
        </Typography>
      )}
      {card.items.visibility && (
        <Stack sx={{ gap: 1.5 }}>
          {card.items.itemsArray.map((item, index) => (
            <Box
              key={`${item.text}-${index}`}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <CheckIcon
                sx={{
                  fontSize: 18,
                  color: highlighted ? primaryColor : "#fff",
                }}
              />
              <Typography variant="betipoRegular12" sx={{ color: "#fff" }}>
                {item.text}
              </Typography>
              {item.itemChip.visibility && (
                <Chip
                  label={item.itemChip.text}
                  size="small"
                  sx={{
                    bgcolor: primaryColor,
                    color: secondaryColor,
                    height: "fit-content",
                    fontWeight: 600,
                    borderRadius: "2px",
                  }}
                />
              )}
            </Box>
          ))}
        </Stack>
      )}
      <Box sx={{ flex: 1 }} />
      <Button
        fullWidth
        variant={highlighted ? "contained" : "outlined"}
        onClick={() => onSelect(card.planUuid)}
        disabled={Boolean(isActivePlan)}
        sx={{
          borderRadius: 0.5,
          ...(highlighted && !isActivePlan
            ? {
                bgcolor: primaryColor,
                color: secondaryColor,
                "&:hover": {
                  bgcolor: primaryColor,
                  opacity: 0.8,
                  color: secondaryColor,
                },
              }
            : undefined),
        }}
      >
        {isActivePlan ? ACTIVE_PLAN_TEXT : card.buttonText.text}
      </Button>
      <Stack sx={{ gap: 0.5 }}>
        <Typography variant="betipoRegular10" sx={{ color: "#fff" }}>
          {FIXED_FOOTNOTE}
        </Typography>
        {card.footnotes.map((footnote, index) => (
          <Typography
            key={`${footnote.text}-${index}`}
            variant="betipoRegular10"
            sx={{ color: "#fff" }}
          >
            {footnote.text}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}
