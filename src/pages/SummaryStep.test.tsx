import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, vi, it, expect } from 'vitest';
import { SummaryStep } from './SummaryStep';
import { ApiError } from '../api';
import type { Quote } from '../types';
const state = vi.hoisted(() => ({
  quote: {
    id: 'test-id',
    name: 'Test',
    email: 'test@example.com',
    age: 30,
    zipCode: '90210',
    status: 'DRAFT',
    coverageType: 'BASIC',
    estimatedMonthlyPremium: 50,
    conditions: [],
    hasPreexistingConditions: null,
    takesPrescriptionMedication: null,
    usesTobacco: null,
    needsSpouseCoverage: null,
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-09-15T10:00:00Z',
    submittedAt: null,
  } as Quote,
  submit: vi.fn(),
  reload: vi.fn(),
  startNew: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('../QuoteContext', () => ({ useQuote: () => state }));
beforeEach(() => {
  state.quote = {
    ...state.quote,
    age: 30,
    status: 'DRAFT',
    coverageType: 'BASIC',
    estimatedMonthlyPremium: 50,
    conditions: [],
    hasPreexistingConditions: null,
    takesPrescriptionMedication: null,
    usesTobacco: null,
    needsSpouseCoverage: null,
  };
  state.submit.mockReset();
  state.reload.mockReset();
  state.startNew.mockReset();
});
it('shows actual submission errors and offers reload', async () => {
  state.submit.mockRejectedValue(
    new ApiError('The insurer is unavailable. Retry.', 502, 'INSURER_UNAVAILABLE'),
  );
  render(
    <MemoryRouter>
      <SummaryStep />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Submit quote' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('The insurer is unavailable. Retry.');
  expect(screen.getByRole('button', { name: 'Reload saved quote' })).toBeEnabled();
  await userEvent.click(screen.getByRole('button', { name: 'Reload saved quote' }));
  expect(state.reload).toHaveBeenCalledOnce();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it.each([
  ['DRAFT', 'Submit quote'],
  ['SUBMISSION_FAILED', 'Retry submission'],
] as const)(
  'keeps a %s quote editable and submits with the expected action',
  async (status, label) => {
    state.quote.status = status;
    render(
      <MemoryRouter>
        <SummaryStep />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Everything look right?' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Edit coverage' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: label }));
    expect(state.submit).toHaveBeenCalledOnce();
  },
);
it.each([
  ['SUBMITTED', "You're all set."],
  ['EXPIRED', 'This quote has expired.'],
] as const)('shows the %s heading and starts a new quote', async (status, heading) => {
  state.quote.status = status;
  render(
    <MemoryRouter initialEntries={['/summary']}>
      <Routes>
        <Route path="/summary" element={<SummaryStep />} />
        <Route path="/personal" element={<h1>Personal form</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: heading })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Edit coverage' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Start a new quote' }));
  expect(state.startNew).toHaveBeenCalledOnce();
  expect(screen.getByRole('heading', { name: 'Personal form' })).toBeVisible();
});
it('shows an expired quote even if no coverage was saved', () => {
  state.quote.status = 'EXPIRED';
  state.quote.coverageType = null;
  state.quote.estimatedMonthlyPremium = null;
  render(
    <MemoryRouter>
      <SummaryStep />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: 'This quote has expired.' })).toBeVisible();
  expect(screen.getByText('No coverage selected')).toBeVisible();
  expect(screen.getByText('Not calculated')).toBeVisible();
});
it.each([65, 66])('shows health details only above the age boundary (%i)', (age) => {
  state.quote.age = age;
  state.quote.conditions = ['DIABETES', 'OTHER'];
  state.quote.hasPreexistingConditions = true;
  state.quote.takesPrescriptionMedication = true;
  state.quote.usesTobacco = false;
  state.quote.needsSpouseCoverage = true;
  render(
    <MemoryRouter>
      <SummaryStep />
    </MemoryRouter>,
  );
  if (age === 65) {
    expect(screen.queryByText('Prescription medication')).not.toBeInTheDocument();
  } else {
    expect(screen.getByText('Diabetes, Other')).toBeVisible();
    expect(screen.getByText('Prescription medication').nextElementSibling).toHaveTextContent('Yes');
    expect(screen.getByText('Tobacco use').nextElementSibling).toHaveTextContent('No');
    expect(screen.getByText('Spouse coverage').nextElementSibling).toHaveTextContent('Yes');
  }
});
