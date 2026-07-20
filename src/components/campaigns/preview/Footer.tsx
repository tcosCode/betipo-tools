import { useState } from "react";

import CheckIcon from "@mui/icons-material/Check";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";

import type { PlanModalTemplate } from "../../../features/campaigns/campaign-schema";

interface FooterProps {
  footer: PlanModalTemplate["footer"];
  generalData: PlanModalTemplate["generalData"];
}

export function Footer({ footer, generalData }: Readonly<FooterProps>) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          onClick={() => setOpen((current) => !current)}
          endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ borderRadius: "999px" }}
        >
          ¿Qué incluyen todos los planes Betipo?
        </Button>
      </Box>
      <Collapse in={open}>
        <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap", pt: 1 }}>
          {footer.footerColumns.map((column, columnIndex) => (
            <Box
              key={`${column.title}-${columnIndex}`}
              sx={{
                flex: "1 1 0",
                minWidth: 200,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="betipoMedium16"
                  sx={{ color: "#fff", fontWeight: 700 }}
                >
                  {column.title}
                </Typography>
                {column.chip.visibility && (
                  <Chip
                    label={column.chip.text}
                    size="small"
                    sx={{
                      bgcolor: generalData.primaryColor,
                      color: generalData.secondaryColor,
                      height: 22,
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {column.columnItems.map((item, itemIndex) => (
                  <Box
                    key={`${item.text}-${itemIndex}`}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <CheckIcon sx={{ fontSize: 18, color: "#2ED47A" }} />
                    <Typography
                      variant="betipoRegular14"
                      sx={{ color: "#fff" }}
                    >
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
