import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, it, expect } from 'vitest';
import { PersonalStep } from './PersonalStep';
const state = vi.hoisted(() => ({ quote: null, savePersonal: vi.fn(), signOut: vi.fn() }));
vi.mock('../QuoteContext', () => ({ useQuote: () => state }));
function setup() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<PersonalStep />} />
        <Route path="/coverage" element={<p>Coverage destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}
it('blocks empty fields and sends no request', async () => {
  state.savePersonal.mockReset();
  setup();
  await userEvent.click(screen.getByRole('button', { name: 'Continue to coverage' }));
  expect(await screen.findByText('Enter your full name.')).toBeVisible();
  expect(state.savePersonal).not.toHaveBeenCalled();
});
it('saves validated values before navigating', async () => {
  state.savePersonal.mockReset().mockResolvedValue(undefined);
  setup();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Full name'), 'Test Person');
  await user.type(screen.getByLabelText('Email address'), 'test@example.com');
  await user.type(screen.getByLabelText('Age'), '70');
  await user.type(screen.getByLabelText('ZIP code'), '90210');
  await user.click(screen.getByRole('button', { name: 'Continue to coverage' }));
  expect(await screen.findByText('Coverage destination')).toBeVisible();
  expect(state.savePersonal).toHaveBeenCalledWith({
    name: 'Test Person',
    email: 'test@example.com',
    age: 70,
    zipCode: '90210',
  });
});
