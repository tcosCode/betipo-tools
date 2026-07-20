import {
  Controller,
  useFieldArray,
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
} from "react-hook-form";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { getCycleLabel } from "../../features/plans/plan-business";
import {
  billingCycles,
  type PlanWriteInput,
} from "../../features/plans/plan-schema";

interface PlanBillingItemsEditorProps {
  control: Control<PlanWriteInput>;
  getValues: UseFormGetValues<PlanWriteInput>;
  setValue: UseFormSetValue<PlanWriteInput>;
}

export function PlanBillingItemsEditor({
  control,
  getValues,
  setValue,
}: Readonly<PlanBillingItemsEditorProps>) {
  const phases = useFieldArray({ control, name: "items" });

  const addPhase = () => {
    const currentItems = getValues("items");
    const previousIndex = currentItems.length - 1;
    if (previousIndex >= 0 && currentItems[previousIndex].duracion === null) {
      setValue(`items.${previousIndex}.duracion`, 1, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    phases.append({
      nombre: "",
      precioFacturacion: "",
      cicloFacturacion: "MENSUAL",
      duracion: null,
    });
  };

  const removePhase = (index: number) => {
    const nextLength = phases.fields.length - 1;
    phases.remove(index);
    if (nextLength > 0) {
      setValue(`items.${nextLength - 1}.duracion`, null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        El precio inicial se cobra al contratar. Estas etapas definen los cobros
        posteriores y se ejecutan en orden.
      </Alert>
      {phases.fields.map((phase, index) => {
        const isLast = index === phases.fields.length - 1;
        return (
          <Paper key={phase.id} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ flex: 1 }}
                >
                  Etapa {index + 1}{" "}
                  {isLast
                    ? "· se repite indefinidamente"
                    : "· duración limitada"}
                </Typography>
                <IconButton
                  aria-label={`Eliminar etapa ${index + 1}`}
                  color="error"
                  disabled={phases.fields.length === 1}
                  onClick={() => removePhase(index)}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr 1fr" },
                  gap: 2,
                }}
              >
                <Controller
                  control={control}
                  name={`items.${index}.nombre`}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id={`billing-name-${index}`}
                      label="Nombre de la etapa"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`items.${index}.precioFacturacion`}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id={`billing-price-${index}`}
                      label="Precio"
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
                <Controller
                  control={control}
                  name={`items.${index}.cicloFacturacion`}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id={`billing-cycle-${index}`}
                      select
                      label="Frecuencia"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    >
                      {billingCycles.map((cycle) => (
                        <MenuItem key={cycle} value={cycle}>
                          Cada {getCycleLabel(cycle)}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                {isLast ? (
                  <TextField
                    id={`billing-duration-${index}`}
                    label="Duración"
                    value="Sin límite"
                    disabled
                    helperText="Se seguirá cobrando hasta cancelar"
                  />
                ) : (
                  <Controller
                    control={control}
                    name={`items.${index}.duracion`}
                    render={({ field, fieldState }) => (
                      <TextField
                        id={`billing-duration-${index}`}
                        label="Duración"
                        type="number"
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
                          fieldState.error?.message ?? "Número de cobros"
                        }
                        slotProps={{ htmlInput: { min: 1, step: 1 } }}
                      />
                    )}
                  />
                )}
              </Box>
            </Stack>
          </Paper>
        );
      })}
      <Button
        startIcon={<AddIcon />}
        disabled={phases.fields.length >= 10}
        onClick={addPhase}
        sx={{ alignSelf: "flex-start" }}
      >
        Añadir etapa antes de la renovación
      </Button>
    </Stack>
  );
}
