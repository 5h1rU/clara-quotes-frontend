import { useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuote } from '../QuoteContext';
import { ApiError } from '../api';
import type { PersonalInfo } from '../types';
import { StepHeading } from '../components/StepHeading';
import { ErrorNotice } from '../components/ErrorNotice';
const schema = yup.object({
  name: yup.string().trim().required('Enter your full name.').max(120),
  email: yup
    .string()
    .trim()
    .email('Enter a valid email address.')
    .required('Enter your email.')
    .max(254),
  age: yup
    .number()
    .typeError('Enter your age.')
    .integer('Use a whole number.')
    .min(1)
    .max(120)
    .required(),
  zipCode: yup
    .string()
    .matches(/^[0-9]{5}(-[0-9]{4})?$/, 'Use a five-digit US ZIP or ZIP+4.')
    .required('Enter your ZIP code.'),
});
export function PersonalStep() {
  const { quote, savePersonal } = useQuote();
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<PersonalInfo>({
    resolver: yupResolver(schema),
    defaultValues: quote
      ? { name: quote.name, email: quote.email, age: quote.age, zipCode: quote.zipCode }
      : { name: '', email: '', zipCode: '' },
  });
  if (quote?.status === 'SUBMITTED' || quote?.status === 'EXPIRED')
    return <Navigate to="/summary" replace />;
  return (
    <>
      <StepHeading
        step="STEP 01 / PERSONAL INFORMATION"
        title="Let's start with you."
        description="A few details to calculate the right estimate."
      />
      {quote && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Changing personal details creates a new quote. Your previous draft will expire
          automatically.
        </Alert>
      )}
      <ErrorNotice error={error} />
      <Stack
        component="form"
        spacing={3}
        noValidate
        onSubmit={handleSubmit(async (data) => {
          setError(null);
          try {
            await savePersonal(data);
            navigate('/coverage');
          } catch (e) {
            setError(e);
            if (e instanceof ApiError)
              for (const [field, message] of Object.entries(e.fieldErrors))
                if (field in data) setFieldError(field as keyof PersonalInfo, { message });
          }
        })}
      >
        <TextField
          label="Full name"
          autoComplete="name"
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="Age"
            type="number"
            slotProps={{ htmlInput: { min: 1, max: 120, inputMode: 'numeric' } }}
            {...register('age')}
            error={!!errors.age}
            helperText={errors.age?.message}
          />
          <TextField
            fullWidth
            label="ZIP code"
            autoComplete="postal-code"
            {...register('zipCode')}
            error={!!errors.zipCode}
            helperText={errors.zipCode?.message ?? 'US ZIP code'}
          />
        </Stack>
        <div className="form-actions">
          <Button
            type="submit"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardRounded />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : 'Continue to coverage'}
          </Button>
        </div>
      </Stack>
    </>
  );
}
