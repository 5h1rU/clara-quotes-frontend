import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
export function YesNoField({
  label,
  name,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  error?: string;
}) {
  return (
    <FormControl error={!!error} fullWidth sx={{ mb: 2 }}>
      <FormLabel id={`${name}-label`}>{label}</FormLabel>
      <RadioGroup
        row
        name={name}
        aria-labelledby={`${name}-label`}
        value={value === undefined ? '' : String(value)}
        onChange={(_, next) => onChange(next === 'true')}
      >
        <FormControlLabel value="true" control={<Radio />} label="Yes" />
        <FormControlLabel value="false" control={<Radio />} label="No" />
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}
