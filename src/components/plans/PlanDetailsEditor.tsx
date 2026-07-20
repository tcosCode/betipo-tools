import { Controller, useFieldArray, type Control } from "react-hook-form";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { PlanWriteInput } from "../../features/plans/plan-schema";

interface PlanDetailsEditorProps {
  control: Control<PlanWriteInput>;
}

export function PlanDetailsEditor({
  control,
}: Readonly<PlanDetailsEditorProps>) {
  const details = useFieldArray({ control, name: "detalles" });

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Estas prestaciones se copian al plan de cada inmobiliaria cuando lo
        contrata.
      </Typography>
      {details.fields.map((detail, index) => (
        <Stack
          key={detail.id}
          direction="row"
          spacing={1}
          alignItems="flex-start"
        >
          <Controller
            control={control}
            name={`detalles.${index}.text`}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                id={`plan-detail-${index}`}
                fullWidth
                label={`Prestación ${index + 1}`}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <IconButton
            aria-label={`Eliminar prestación ${index + 1}`}
            color="error"
            onClick={() => details.remove(index)}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      ))}
      <Button
        startIcon={<AddIcon />}
        disabled={details.fields.length >= 20}
        onClick={() => details.append({ key: crypto.randomUUID(), text: "" })}
        sx={{ alignSelf: "flex-start" }}
      >
        Añadir prestación
      </Button>
    </Stack>
  );
}
