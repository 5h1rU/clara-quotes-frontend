import { test, expect, type Page } from '@playwright/test';
async function signIn(page: Page) {
  await page.goto('/');
  await page.getByLabel('Username').fill(process.env.API_USERNAME ?? 'reviewer');
  await page.getByLabel('Password').fill(process.env.API_PASSWORD ?? 'local-review-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
async function personal(page: Page, age: string) {
  await page.getByLabel('Full name').fill('Browser Test');
  await page.getByLabel('Email address').fill('browser@example.com');
  await page.getByLabel('Age', { exact: true }).fill(age);
  await page.getByLabel('ZIP code').fill('90210');
  await page.getByRole('button', { name: 'Continue to coverage' }).click();
}
test('senior flow uses real API, submits, and resumes after refresh', async ({ page }) => {
  await signIn(page);
  await personal(page, '70');
  await page.getByRole('radio', { name: 'Standard', exact: false }).check();
  await page
    .getByRole('radiogroup', { name: 'Any pre-existing conditions?' })
    .getByRole('radio', { name: 'Yes', exact: true })
    .check();
  await page.getByLabel('Diabetes').check();
  for (const name of [
    'Do you take prescription medication?',
    'Do you use tobacco?',
    'Include coverage for your spouse?',
  ])
    await page
      .getByRole('radiogroup', { name })
      .getByRole('radio', { name: 'Yes', exact: true })
      .check();
  await expect(page.getByRole('status')).toContainText('$327.60');
  await page.getByRole('button', { name: 'Review quote' }).click();
  await expect(page.getByText('$327.60', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Edit coverage' }).click();
  await expect(page.getByLabel('Diabetes')).toBeChecked();
  await page.getByRole('button', { name: 'Review quote' }).click();
  await page.getByRole('button', { name: 'Submit quote', exact: true }).click();
  await expect(page.getByRole('heading', { name: "You're all set." })).toBeVisible({
    timeout: 20000,
  });
  await page.reload();
  await signIn(page);
  await expect(page.getByRole('heading', { name: "You're all set." })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
});
test('age 65 hides health questions and personal edits start a new draft', async ({ page }) => {
  await signIn(page);
  await personal(page, '65');
  await expect(page.getByText('A few health details')).toHaveCount(0);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Age', { exact: true })).toHaveValue('65');
  await page.getByLabel('Age', { exact: true }).fill('66');
  await page.getByRole('button', { name: 'Continue to coverage' }).click();
  await expect(page.getByText('A few health details')).toBeVisible();
});
test('invalid credentials produce a readable error', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Username').fill('wrong');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Sign in with the configured API credentials.',
  );
});
