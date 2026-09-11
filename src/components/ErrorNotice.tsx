import { Alert, Button } from '@mui/material';
import { ApiError, errorMessage } from '../api';
import { useQuote } from '../QuoteContext';
export function ErrorNotice({ error }: { error: unknown }) {
  const { signOut } = useQuote();
  if (!error) return null;
  return (
    <Alert
      severity="error"
      sx={{ mb: 3 }}
      action={
        error instanceof ApiError && error.status === 401 ? (
          <Button color="inherit" onClick={signOut}>
            Sign in again
          </Button>
        ) : undefined
      }
    >
      {errorMessage(error)}
    </Alert>
  );
}
