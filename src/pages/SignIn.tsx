import { useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuote } from '../QuoteContext';
import { errorMessage } from '../api';
const schema = yup.object({
  username: yup
    .string()
    .required('Enter your username.')
    .test('no-colon', 'Username cannot contain a colon.', (v) => !v?.includes(':')),
  password: yup.string().required('Enter your password.'),
});
export function SignIn() {
  const { signIn } = useQuote();
  const [error, setError] = useState<unknown>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema), defaultValues: { username: '', password: '' } });
  return (
    <Box className="signin-card">
      <Typography className="eyebrow">INSURANCE QUOTES</Typography>
      <Typography component="h1" variant="h3">
        A little clarity.
        <br />
        Before you choose.
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 2, mb: 4 }}>
        Sign in to create and review your insurance quote.
      </Typography>
      {!!error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage(error)}
        </Alert>
      )}
      <Stack
        component="form"
        spacing={2.5}
        onSubmit={handleSubmit(async (data) => {
          setError(null);
          try {
            await signIn(data);
          } catch (e) {
            setError(e);
          }
        })}
        noValidate
      >
        <TextField
          label="Username"
          autoComplete="username"
          {...register('username')}
          error={!!errors.username}
          helperText={errors.username?.message}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </Stack>
    </Box>
  );
}
