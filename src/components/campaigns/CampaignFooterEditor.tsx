import { useFieldArray, type Control } from "react-hook-form";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { CampaignWriteInput } from "../../features/campaigns/campaign-schema";
import { CampaignSwitch, CampaignTextField } from "./CampaignFormFields";

function FooterColumnEditor({
  control,
  index,
  onRemove,
  canRemove,
}: Readonly<{
  control: Control<CampaignWriteInput>;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}>) {
  const items = useFieldArray({
    control,
    name: `uiTemplate.footer.footerColumns.${index}.columnItems`,
  });
  const prefix = `uiTemplate.footer.footerColumns.${index}` as const;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CampaignTextField
            control={control}
            name={`${prefix}.title`}
            label="Título"
            fullWidth
          />
          <IconButton
            aria-label="Eliminar columna"
            disabled={!canRemove}
            onClick={onRemove}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          alignItems={{ md: "center" }}
        >
          <CampaignSwitch
            control={control}
            name={`${prefix}.chip.visibility`}
            label="Mostrar chip"
          />
          <CampaignTextField
            control={control}
            name={`${prefix}.chip.text`}
            label="Texto del chip"
            fullWidth
          />
        </Stack>
        {items.fields.map((item, itemIndex) => (
          <Stack key={item.id} direction="row" spacing={1}>
            <CampaignTextField
              control={control}
              name={`${prefix}.columnItems.${itemIndex}.text`}
              label={`Prestación ${itemIndex + 1}`}
              fullWidth
            />
            <IconButton
              aria-label="Eliminar prestación"
              disabled={items.fields.length <= 1}
              onClick={() => items.remove(itemIndex)}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        ))}
        <Button
          size="small"
          startIcon={<AddIcon />}
          disabled={items.fields.length >= 3}
          onClick={() => items.append({ text: "Nueva prestación" })}
        >
          Añadir prestación
        </Button>
      </Stack>
    </Paper>
  );
}

export function CampaignFooterEditor({
  control,
}: Readonly<{ control: Control<CampaignWriteInput> }>) {
  const columns = useFieldArray({
    control,
    name: "uiTemplate.footer.footerColumns",
  });

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h6">Prestaciones comunes</Typography>
          <Typography variant="body2" color="text.secondary">
            Entre dos y cuatro columnas, con al menos una prestación cada una.
          </Typography>
        </div>
        <Button
          startIcon={<AddIcon />}
          disabled={columns.fields.length >= 4}
          onClick={() =>
            columns.append({
              title: "Nueva columna",
              chip: { visibility: false, text: "" },
              columnItems: [{ text: "Nueva prestación" }],
            })
          }
        >
          Añadir columna
        </Button>
      </Stack>
      {columns.fields.map((column, index) => (
        <FooterColumnEditor
          key={column.id}
          control={control}
          index={index}
          canRemove={columns.fields.length > 2}
          onRemove={() => columns.remove(index)}
        />
      ))}
    </Stack>
  );
}
