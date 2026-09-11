import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect } from 'vitest';
import { CoverageStep } from './CoverageStep';
const state = vi.hoisted(() => ({
  quote: { age: 65, status: 'DRAFT' },
  saveCoverage: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('../QuoteContext', () => ({ useQuote: () => state }));
it('hides health questions at 65 and never sends their fields', async () => {
  state.quote.age = 65;
  state.saveCoverage.mockReset().mockResolvedValue(undefined);
  render(
    <MemoryRouter>
      <CoverageStep />
    </MemoryRouter>,
  );
  expect(screen.queryByText('A few health details')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Review quote' }));
  expect(state.saveCoverage).toHaveBeenCalledWith({ coverageType: 'BASIC' });
});
it('requires senior answers and updates the estimate for tobacco', async () => {
  state.quote.age = 70;
  state.saveCoverage.mockReset();
  render(
    <MemoryRouter>
      <CoverageStep />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Review quote' }));
  expect(await screen.findAllByText('Choose Yes or No.')).toHaveLength(4);
  expect(state.saveCoverage).not.toHaveBeenCalled();
  await userEvent.click(
    within(screen.getByRole('radiogroup', { name: 'Do you use tobacco?' })).getByLabelText('Yes'),
  );
  expect(screen.getByRole('status')).toHaveTextContent('$90.00');
});
it('clears selected conditions when the answer changes to no', async () => {
  state.quote.age = 70;
  render(
    <MemoryRouter>
      <CoverageStep />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  const group = screen.getByRole('radiogroup', { name: 'Any pre-existing conditions?' });
  await user.click(within(group).getByLabelText('Yes'));
  await user.click(screen.getByLabelText('Diabetes'));
  expect(screen.getByRole('status')).toHaveTextContent('$97.50');
  await user.click(within(group).getByLabelText('No'));
  expect(screen.queryByLabelText('Diabetes')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('$75.00');
});
