import type { Control, FieldPathByValue } from "react-hook-form";
import { Controller } from "react-hook-form";

import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField, { type TextFieldProps } from "@mui/material/TextField";

import type { CampaignWriteInput } from "../../features/campaigns/campaign-schema";

type StringPath = FieldPathByValue<CampaignWriteInput, string | undefined>;
type BooleanPath = FieldPathByValue<CampaignWriteInput, boolean>;

interface CampaignTextFieldProps extends Omit<
  TextFieldProps,
  "name" | "defaultValue"
> {
  control: Control<CampaignWriteInput>;
  name: StringPath;
}

export function CampaignTextField({
  control,
  name,
  ...props
}: CampaignTextFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          value={field.value ?? ""}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? props.helperText}
        />
      )}
    />
  );
}

interface CampaignSwitchProps {
  control: Control<CampaignWriteInput>;
  name: BooleanPath;
  label: string;
}

export function CampaignSwitch({
  control,
  name,
  label,
}: Readonly<CampaignSwitchProps>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormControlLabel
          label={label}
          control={
            <Switch
              checked={field.value}
              onBlur={field.onBlur}
              onChange={(_, checked) => field.onChange(checked)}
            />
          }
        />
      )}
    />
  );
}
