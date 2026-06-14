import { test as setup } from '@playwright/test';
import { STORAGE_STATE, MANAGER_STORAGE_STATE } from './fixtures/auth.fixture';
import { loginAs } from './fixtures/helpers';

setup('authenticate as standard user', async ({ page }) => {
  await loginAs(page, 'user@assessos.test', 'TestPass123!');
  await page.context().storageState({ path: STORAGE_STATE });
});

setup('authenticate as manager', async ({ page }) => {
  await loginAs(page, 'manager@assessos.test', 'TestPass123!');
  await page.context().storageState({ path: MANAGER_STORAGE_STATE });
});
