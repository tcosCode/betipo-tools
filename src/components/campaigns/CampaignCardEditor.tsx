import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type {
  CampaignWriteInput,
  PlanOption,
} from "../../features/campaigns/campaign-schema";
import { CampaignSwitch, CampaignTextField } from "./CampaignFormFields";

interface CampaignCardEditorProps {
  index: number;
  control: Control<CampaignWriteInput>;
  setValue: UseFormSetValue<CampaignWriteInput>;
  plans: PlanOption[];
}

const displayPlanPrice = (price: string) =>
  price
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "")
    .replace(".", ",");

export function CampaignCardEditor({
  index,
  control,
  setValue,
  plans,
}: Readonly<CampaignCardEditorProps>) {
  const items = useFieldArray({
    control,
    name: `uiTemplate.cards.${index}.items.itemsArray`,
  });
  const footnotes = useFieldArray({
    control,
    name: `uiTemplate.cards.${index}.footnotes`,
  });
  const selectedCards = useWatch({ control, name: "uiTemplate.cards" });

  const prefix = `uiTemplate.cards.${index}` as const;

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <Typography variant="h6" sx={{ minWidth: 110 }}>
            Tarjeta {index + 1}
          </Typography>
          <Controller
            control={control}
            name={`${prefix}.planUuid`}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Plan destino"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={(event) => {
                  const planUuid = event.target.value;
                  field.onChange(planUuid);
                  const plan = plans.find((option) => option.uuid === planUuid);
                  if (plan) {
                    setValue(`${prefix}.planTitle.text`, plan.nombre, {
                      shouldDirty: true,
                    });
                    setValue(
                      `${prefix}.price.text`,
                      displayPlanPrice(plan.precio),
                      {
                        shouldDirty: true,
                      },
                    );
                  }
                }}
              >
                {plans.map((plan) => (
                  <MenuItem
                    key={plan.uuid}
                    value={plan.uuid}
                    disabled={selectedCards.some(
                      (card, cardIndex) =>
                        cardIndex !== index && card.planUuid === plan.uuid,
                    )}
                  >
                    {plan.nombre} · {displayPlanPrice(plan.precio)} € ·{" "}
                    {plan.uuid.slice(0, 8)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            control={control}
            name={`${prefix}.highlighted`}
            render={({ field }) => (
              <FormControlLabel
                label="Destacado"
                control={
                  <Switch
                    checked={field.value}
                    onChange={(_, checked) => {
                      if (checked) {
                        for (let cardIndex = 0; cardIndex < 3; cardIndex += 1) {
                          setValue(
                            `uiTemplate.cards.${cardIndex}.highlighted`,
                            cardIndex === index,
                            {
                              shouldDirty: true,
                            },
                          );
                        }
                      } else {
                        field.onChange(false);
                      }
                    }}
                  />
                }
              />
            )}
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: 2,
          }}
        >
          <CampaignTextField
            control={control}
            name={`${prefix}.planTitle.text`}
            label="Título comercial"
            fullWidth
          />
          <CampaignTextField
            control={control}
            name={`${prefix}.price.text`}
            label="Precio"
            fullWidth
            disabled
            helperText="Se obtiene de la tabla planes"
          />
        </Box>

        <Stack spacing={1}>
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

        <Stack spacing={1}>
          <CampaignSwitch
            control={control}
            name={`${prefix}.planSubtitle.visibility`}
            label="Mostrar subtítulo"
          />
          <CampaignTextField
            control={control}
            name={`${prefix}.planSubtitle.text`}
            label="Subtítulo"
            fullWidth
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Stack spacing={1}>
            <CampaignSwitch
              control={control}
              name={`${prefix}.priceDiscount.visibility`}
              label="Mostrar precio anterior"
            />
            <CampaignTextField
              control={control}
              name={`${prefix}.priceDiscount.text`}
              label="Precio anterior"
              fullWidth
            />
          </Stack>
          <CampaignTextField
            control={control}
            name={`${prefix}.priceSubtitle.text`}
            label="Texto bajo el precio"
            fullWidth
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Stack spacing={1}>
            <CampaignSwitch
              control={control}
              name={`${prefix}.helperText.visibility`}
              label="Mostrar texto auxiliar"
            />
            <CampaignTextField
              control={control}
              name={`${prefix}.helperText.text`}
              label="Texto auxiliar"
              fullWidth
            />
          </Stack>
          <Stack spacing={1}>
            <CampaignSwitch
              control={control}
              name={`${prefix}.helperIconText.visibility`}
              label="Mostrar ahorro con icono"
            />
            <Stack direction="row" spacing={1}>
              <CampaignTextField
                control={control}
                name={`${prefix}.helperIconText.text`}
                label="Texto de ahorro"
                fullWidth
              />
              <CampaignTextField
                control={control}
                name={`${prefix}.helperIconText.textColor`}
                label="Color"
                type="color"
                sx={{ width: 100 }}
              />
            </Stack>
          </Stack>
        </Box>

        <CampaignTextField
          control={control}
          name={`${prefix}.buttonText.text`}
          label="Texto del botón"
          fullWidth
        />

        <Stack spacing={1.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <CampaignSwitch
              control={control}
              name={`${prefix}.items.visibility`}
              label="Mostrar prestaciones"
            />
            <Button
              size="small"
              startIcon={<AddIcon />}
              disabled={items.fields.length >= 5}
              onClick={() =>
                items.append({
                  text: "Nueva prestación",
                  itemChip: { visibility: false, text: "" },
                })
              }
            >
              Añadir prestación
            </Button>
          </Stack>
          {items.fields.map((item, itemIndex) => (
            <Stack
              key={item.id}
              direction={{ xs: "column", md: "row" }}
              spacing={1}
            >
              <CampaignTextField
                control={control}
                name={`${prefix}.items.itemsArray.${itemIndex}.text`}
                label={`Prestación ${itemIndex + 1}`}
                fullWidth
              />
              <CampaignSwitch
                control={control}
                name={`${prefix}.items.itemsArray.${itemIndex}.itemChip.visibility`}
                label="Chip"
              />
              <CampaignTextField
                control={control}
                name={`${prefix}.items.itemsArray.${itemIndex}.itemChip.text`}
                label="Texto del chip"
                sx={{ minWidth: 180 }}
              />
              <IconButton
                aria-label="Eliminar prestación"
                onClick={() => items.remove(itemIndex)}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          ))}
        </Stack>

        <Stack spacing={1.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle2">Notas adicionales</Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              disabled={footnotes.fields.length >= 2}
              onClick={() => footnotes.append({ text: "Nueva nota" })}
            >
              Añadir nota
            </Button>
          </Stack>
          {footnotes.fields.map((footnote, footnoteIndex) => (
            <Stack key={footnote.id} direction="row" spacing={1}>
              <CampaignTextField
                control={control}
                name={`${prefix}.footnotes.${footnoteIndex}.text`}
                label={`Nota ${footnoteIndex + 1}`}
                fullWidth
              />
              <IconButton
                aria-label="Eliminar nota"
                onClick={() => footnotes.remove(footnoteIndex)}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
