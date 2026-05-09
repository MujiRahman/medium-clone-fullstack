import { test, expect } from '@playwright/test';

test.describe('Authentication and API Stability', () => {
  test('User can visit Login page and try to authenticate', async ({ page }) => {
    // 1. Visit the homepage to ensure the frontend is active
    await page.goto('/');

    // Ensure the home page doesn't error out completely and displays Medium Clone
    await expect(page.locator('text=Medium Clone').first()).toBeVisible();

    // 2. Click SignIn link if it exists (or just go to /login directly)
    await page.goto('/login');

    // 3. Verify Login page renders correctly
    await expect(page.locator('h1:has-text("Medium Clone")')).toBeVisible();
    await expect(page.locator('text=Sign in to your account')).toBeVisible();

    // 4. Fill in dummy credentials
    await page.fill('input[type="email"]', 'testbot@example.com');
    await page.fill('input[type="password"]', 'botpassword');

    // 5. Submit form
    await page.click('button:has-text("Sign In")');

    // 6. Verify that we don't get a silent ECONNREFUSED crash causing page freeze.
    // If it fails with "Email belum terdaftar" or similar API message, it means the backend IS healthily connected!
    // We expect either navigation home OR a backend-specific error on the UI.
    const hasError = await page.locator('.text-red-600').isVisible({ timeout: 4000 }).catch(() => false);
    
    // If there is an error, we assert the backend is responding (meaning no ECONNREFUSED)
    if (hasError) {
      const errorMsg = await page.locator('.text-red-600').innerText();
      // Ensure the error comes from validation/Auth, not network crash
      expect(errorMsg).not.toContain('ECONNREFUSED');
      expect(errorMsg).not.toContain('Network Error');
      console.log('Backend connected normally. API returned:', errorMsg);
    } else {
      // If it somehow authenticated properly, we should be home
      await expect(page).toHaveURL('/');
    }
  });
});
