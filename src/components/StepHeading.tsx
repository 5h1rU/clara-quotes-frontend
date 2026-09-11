import { Typography } from '@mui/material';
export function StepHeading({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <Typography className="eyebrow" component="p">
        {step}
      </Typography>
      <Typography component="h1" variant="h3" tabIndex={-1}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        {description}
      </Typography>
    </>
  );
}
