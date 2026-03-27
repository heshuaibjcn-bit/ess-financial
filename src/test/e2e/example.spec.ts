import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toContainText(
    'China Industrial & Commercial Energy Storage'
  );
});

test('displays project scaffold message', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('p').filter({ hasText: 'Project scaffold ready' })).toBeVisible();
});
