import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect } from 'vitest';
import { SummaryStep } from './SummaryStep';
import { ApiError } from '../api';
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
  },
  submit: vi.fn(),
  reload: vi.fn(),
  startNew: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('../QuoteContext', () => ({ useQuote: () => state }));
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
});
