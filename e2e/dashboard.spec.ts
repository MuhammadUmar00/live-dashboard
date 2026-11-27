import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Live monitoring' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('live');
});

test('receives and displays events', async ({ page }) => {
  const table = page.getByRole('table', { name: 'Recent events' });
  const eventRows = table.getByRole('row');
  const processedEvents = page
    .getByText('Processed events', { exact: true })
    .locator('..')
    .getByRole('heading');

  await expect.poll(() => eventRows.count()).toBeGreaterThan(1);
  await expect(processedEvents).not.toHaveText('0');
});

test('pauses and resumes the event feed', async ({ page }) => {
  const processedEvents = page
    .getByText('Processed events', { exact: true })
    .locator('..')
    .getByRole('heading');

  await expect(processedEvents).not.toHaveText('0');
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('status')).toHaveText('paused');

  const pausedTotal = await processedEvents.textContent();
  await page.waitForTimeout(600);
  await expect(processedEvents).toHaveText(pausedTotal ?? '');

  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByRole('status')).toHaveText('live');
  await expect
    .poll(() => processedEvents.textContent())
    .not.toBe(pausedTotal);
});

test('filters the event table by status', async ({ page }) => {
  const table = page.getByRole('table', { name: 'Recent events' });
  const rows = table.getByRole('row');
  await expect.poll(() => rows.count()).toBeGreaterThan(1);

  const selectedStatus = await rows.nth(1).getByRole('cell').nth(2).innerText();
  await page.getByRole('combobox', { name: 'Status' }).click();
  await page.getByRole('option', { name: selectedStatus, exact: true }).click();

  const filteredRowCount = await rows.count();
  expect(filteredRowCount).toBeGreaterThan(1);

  for (let index = 1; index < filteredRowCount; index++) {
    await expect(
      rows.nth(index).getByRole('cell').nth(2),
    ).toHaveText(selectedStatus);
  }
});
