import { test, expect } from '@playwright/test';

test.describe('Search and Notification Features', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock user login session state by routing auth/me endpoint
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Success',
          data: {
            id: '5e46e229-13ec-40d9-8132-7de15fcc3195',
            username: 'testbot',
            email: 'testbot@example.com'
          }
        })
      });
    });

    // Mock initial check profile (since the auth flow checks it)
    await page.route('**/api/users/testbot', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Success',
          data: {
            user: {
              id: '5e46e229-13ec-40d9-8132-7de15fcc3195',
              username: 'testbot',
              bio: 'I am a test bot',
              followers_count: 5,
              following_count: 10
            },
            stories: []
          }
        })
      });
    });
  });

  test('Fuzzy Search autocomplete returns matches', async ({ page }) => {
    // Intercept autocomplete search endpoint
    await page.route('**/api/search/autocomplete?q=golang', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Success',
          data: {
            stories: [
              {
                id: '123-abc',
                title: 'Building Concurrent Go Web Apps',
                slug: 'building-concurrent-go-web-apps',
                author: { username: 'godev' }
              }
            ],
            users: [
              {
                id: '456-def',
                username: 'golang_guru',
                bio: 'Go enthusiast'
              }
            ]
          }
        })
      });
    });

    await page.goto('/');

    // Locate the search input in the header navbar and type "golang"
    const searchInput = page.locator('input[placeholder="Search Medium..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('golang');

    // Wait for the autocomplete suggestions dropdown card to show up
    const suggestionsPanel = page.locator('text=People');
    await expect(suggestionsPanel).toBeVisible({ timeout: 5000 });

    // Verify autocomplete content matches our mocked data
    await expect(page.locator('text=Building Concurrent Go Web Apps')).toBeVisible();
    await expect(page.locator('text=golang_guru')).toBeVisible();
  });

  test('Real-time notifications are listed inside NotificationBell panel', async ({ page }) => {
    // Mock user login states on authStore
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: {
            id: '5e46e229-13ec-40d9-8132-7de15fcc3195',
            username: 'testbot',
            email: 'testbot@example.com'
          },
          isAuthenticated: true
        }
      }));
    });

    // Mock fetch notifications api
    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Success',
          data: [
            {
              id: 'notif-123',
              recipient_id: '5e46e229-13ec-40d9-8132-7de15fcc3195',
              sender_id: '999-other',
              sender: { username: 'clapper_jane' },
              type: 'clap',
              message: 'clapper_jane clapped for your story',
              story_slug: 'some-great-story',
              is_read: false,
              created_at: new Date().toISOString()
            }
          ]
        })
      });
    });

    // Mock SSE connection endpoint to return instantly
    await page.route('**/api/notifications/stream', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'event: connected\ndata: listening\n\n'
      });
    });

    await page.goto('/');

    // Verify the unread notification badge is visible (should show "1")
    const badge = page.locator('button[aria-label="Notifications"] span');
    await expect(badge).toBeVisible({ timeout: 5000 });

    // Click the notification bell to open the dropdown
    const bellBtn = page.locator('button[aria-label="Notifications"]');
    await bellBtn.click();

    // Verify the dropdown contains the mocked notification message
    await expect(page.locator('text=clapper_jane clapped for your story')).toBeVisible();
  });
});
