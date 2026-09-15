import { isSenior } from '../applicantRules';
import { useState } from 'react';
import { Alert, Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuote } from '../QuoteContext';
import type { Quote, QuoteStatus } from '../types';
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
function SummaryHeading({ status }: { status: QuoteStatus }) {
  if (status === 'SUBMITTED')
    return (
      <StepHeading
        step="QUOTE SUBMITTED"
        title="You're all set."
        description="Your quote has been submitted successfully."
      />
    );
  if (status === 'EXPIRED')
    return (
      <StepHeading
        step="STEP 03 / REVIEW"
        title="This quote has expired."
        description="Start a new quote to get an updated estimate."
      />
    );
  return (
    <StepHeading
      step="STEP 03 / REVIEW"
      title="Everything look right?"
      description="Review your details before submitting your quote."
    />
  );
}
function QuoteDetails({ quote }: { quote: Quote }) {
  const submitted = quote.status === 'SUBMITTED';
  const expired = quote.status === 'EXPIRED';
  const yesNo = (value: boolean | null) => (value ? 'Yes' : 'No');
  return (
    <>
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
        {isSenior(quote.age) && quote.coverageType && (
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
    </>
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
  const newQuote = () => {
    startNew();
    navigate('/personal');
  };
  return (
    <>
      <SummaryHeading status={quote.status} />
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
      <QuoteDetails quote={quote} />
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
