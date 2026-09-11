import { useState } from 'react';
import { Alert, Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuote } from '../QuoteContext';
import { conditionOptions, coverageOptions, money } from '../pricing';
import { StepHeading } from '../components/StepHeading';
import { ErrorNotice } from '../components/ErrorNotice';
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <Typography component="dt" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd">{value}</Typography>
    </div>
  );
}
export function SummaryStep() {
  const { quote, submit, reload, startNew } = useQuote();
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  if (!quote) return <Navigate to="/personal" replace />;
  const submitted = quote.status === 'SUBMITTED';
  const expired = quote.status === 'EXPIRED';
  if (!quote.coverageType && !expired) return <Navigate to="/coverage" replace />;
  const yesNo = (value: boolean | null) => (value ? 'Yes' : 'No');
  const newQuote = () => {
    startNew();
    navigate('/personal');
  };
  return (
    <>
      <StepHeading
        step={submitted ? 'QUOTE SUBMITTED' : 'STEP 03 / REVIEW'}
        title={
          submitted
            ? "You're all set."
            : expired
              ? 'This quote has expired.'
              : 'Everything look right?'
        }
        description={
          submitted
            ? 'Your quote has been submitted successfully.'
            : expired
              ? 'Start a new quote to get an updated estimate.'
              : 'Review your details before submitting your quote.'
        }
      />
      {submitted && (
        <Alert icon={<CheckCircleOutlineRounded />} severity="success" sx={{ mb: 3 }}>
          Submission confirmed. Keep your quote reference below.
        </Alert>
      )}
      {quote.status === 'SUBMISSION_FAILED' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your details are saved. The previous submission failed; you can try again.
        </Alert>
      )}
      <ErrorNotice error={error} />
      <Stack direction="row" sx={{ gap: 1, mb: 3 }}>
        <Chip
          size="small"
          label={submitted ? 'Submitted' : expired ? 'Expired' : 'Ready for review'}
          color={submitted ? 'success' : 'default'}
        />
        <Chip
          size="small"
          variant="outlined"
          label={
            coverageOptions.find((c) => c.value === quote.coverageType)?.label ??
            'No coverage selected'
          }
        />
      </Stack>
      <Box component="dl" sx={{ m: 0 }}>
        <Detail label="Full name" value={quote.name} />
        <Detail label="Email address" value={quote.email} />
        <Detail label="Age" value={String(quote.age)} />
        <Detail label="ZIP code" value={quote.zipCode} />
        {quote.age > 65 && quote.coverageType && (
          <>
            <Divider sx={{ my: 2 }} />
            <Detail
              label="Pre-existing conditions"
              value={
                quote.conditions.length
                  ? quote.conditions
                      .map((c) => conditionOptions.find((option) => option.value === c)?.label ?? c)
                      .join(', ')
                  : 'None'
              }
            />
            <Detail
              label="Prescription medication"
              value={yesNo(quote.takesPrescriptionMedication)}
            />
            <Detail label="Tobacco use" value={yesNo(quote.usesTobacco)} />
            <Detail label="Spouse coverage" value={yesNo(quote.needsSpouseCoverage)} />
          </>
        )}
      </Box>
      <Box className="premium-preview" sx={{ mt: 3 }}>
        <div>
          <Typography variant="body2">Estimated monthly premium</Typography>
          <Typography variant="h3" component="p">
            {quote.estimatedMonthlyPremium === null
              ? 'Not calculated'
              : money(quote.estimatedMonthlyPremium)}
            <Typography component="span" variant="body2">
              {' '}
              / month
            </Typography>
          </Typography>
        </div>
      </Box>
      <Typography
        color="text.secondary"
        variant="caption"
        component="p"
        sx={{ mt: 2, overflowWrap: 'anywhere' }}
      >
        Quote reference: {quote.id}
      </Typography>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mt: 4 }}
      >
        {submitted || expired ? (
          <Button variant="contained" onClick={newQuote}>
            Start a new quote
          </Button>
        ) : (
          <>
            <Button disabled={busy} onClick={() => navigate('/coverage')}>
              Edit coverage
            </Button>
            <Button
              disabled={busy}
              size="large"
              variant="contained"
              onClick={async () => {
                setError(null);
                setBusy(true);
                try {
                  await submit();
                } catch (e) {
                  setError(e);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy
                ? 'Submitting…'
                : quote.status === 'SUBMISSION_FAILED'
                  ? 'Retry submission'
                  : 'Submit quote'}
            </Button>
          </>
        )}
      </Stack>
      {!!error && (
        <Button
          sx={{ mt: 2 }}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await reload();
              setError(null);
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          Reload saved quote
        </Button>
      )}
    </>
  );
}
