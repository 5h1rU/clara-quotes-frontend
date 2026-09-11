import { useEffect } from 'react';
import { Box, Button, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useQuote } from './QuoteContext';
import { SignIn } from './pages/SignIn';
import { PersonalStep } from './pages/PersonalStep';
import { CoverageStep } from './pages/CoverageStep';
import { SummaryStep } from './pages/SummaryStep';
export function App() {
  const { signedIn, signOut, quote } = useQuote();
  const location = useLocation();
  const step = location.pathname === '/coverage' ? 1 : location.pathname === '/summary' ? 2 : 0;
  useEffect(() => {
    document.querySelector<HTMLElement>('h1')?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname, signedIn]);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="/">
          clara<span className="brand-dot">.</span>
        </a>
        <span className="header-label">INSURANCE QUOTES</span>
        {signedIn && (
          <Button size="small" onClick={signOut}>
            Sign out
          </Button>
        )}
      </header>
      {!signedIn ? (
        <main id="main" className="signin-layout">
          <SignIn />
          <aside className="signin-aside">
            <div className="abstract-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <Typography variant="h4" component="p">
              Your next step,
              <br />
              with a clearer picture.
            </Typography>
            <Typography sx={{ mt: 2, maxWidth: 300 }}>
              Personal details. Coverage options. One estimate you can review before submitting.
            </Typography>
          </aside>
        </main>
      ) : (
        <main id="main" className="quote-layout">
          <aside className="flow-sidebar">
            <Typography className="eyebrow">YOUR QUOTE</Typography>
            <Typography variant="h4" component="p" sx={{ mt: 2, mb: 4 }}>
              A clear path
              <br />
              to your coverage.
            </Typography>
            <Stepper activeStep={quote?.status === 'SUBMITTED' ? 3 : step} orientation="vertical">
              {['Personal information', 'Coverage selection', 'Review & submit'].map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Typography variant="body2" className="sidebar-note">
              Your progress is saved as you complete each step.
            </Typography>
          </aside>
          <Box className="form-panel">
            <Routes>
              <Route path="/personal" element={<PersonalStep />} />
              <Route path="/coverage" element={<CoverageStep />} />
              <Route path="/summary" element={<SummaryStep />} />
              <Route
                path="*"
                element={
                  <Navigate
                    to={quote?.coverageType ? '/summary' : quote ? '/coverage' : '/personal'}
                    replace
                  />
                }
              />
            </Routes>
          </Box>
        </main>
      )}
      <footer className="site-footer">
        Insurance quote calculator <span>All estimates in USD</span>
      </footer>
    </>
  );
}
