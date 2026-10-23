import { test, expect } from '@playwright/test';

test.describe('Security regression checks (no login needed)', () => {
  test('the image proxy refuses arbitrary outside images', async ({ request }) => {
    const res = await request.get('/_next/image?url=https%3A%2F%2Fwww.google.com%2Ffavicon.ico&w=64&q=75');
    expect(res.status()).toBe(400);
  });

  test('responses do not advertise the framework and send protective headers', async ({ request }) => {
    const res = await request.get('/register');
    const h = res.headers();
    expect(h['x-powered-by']).toBeUndefined();
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  test('the old /assessment address redirects to /assess', async ({ request }) => {
    const res = await request.get('/assessment', { maxRedirects: 0 });
    expect([301, 307, 308]).toContain(res.status());
    expect(res.headers()['location']).toContain('/assess');
  });

  test('the login page ignores an off-site redirect target', async ({ page }) => {
    await page.goto('/login?redirect=https%3A%2F%2Fevil.example%2Fphish');
    await expect(page).toHaveURL(/\/login/);
    // (the redirect itself is unit-tested; this proves the page loads and shows no off-site link)
    await expect(page.locator('a[href^="https://evil.example"]')).toHaveCount(0);
  });

  test('health check answers', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
  });
});
