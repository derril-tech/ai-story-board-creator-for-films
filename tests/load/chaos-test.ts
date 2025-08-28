import { test, expect } from '@playwright/test';

test.describe('Chaos Engineering Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="script-upload"]');
  });

  test('Service failure recovery - API down', async ({ page }) => {
    // Simulate API service failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    // Attempt to upload script
    const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-script.fdx');

    // Should show error state
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();

    // Restore API and retry
    await page.unroute('**/api/**');
    await page.click('[data-testid="retry-btn"]');

    // Should recover successfully
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
  });

  test('Worker failure recovery - Frame generation worker down', async ({ page }) => {
    // Upload script first
    const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-script.fdx');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });

    // Navigate to frame generation
    await page.click('[data-testid="scene-item-0"]');
    await page.click('[data-testid="frames-tab"]');
    await page.click('[data-testid="select-all-shots"]');
    await page.click('[data-testid="batch-generate-frames-btn"]');

    // Simulate worker failure during generation
    await page.route('**/api/v1/frames/generate', route => {
      route.abort('failed');
    });

    // Should show error and retry option
    await expect(page.locator('[data-testid="frame-generation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-frame-generation-btn"]')).toBeVisible();

    // Restore worker and retry
    await page.unroute('**/api/v1/frames/generate');
    await page.click('[data-testid="retry-frame-generation-btn"]');

    // Should complete successfully
    await expect(page.locator('[data-testid="frame-status-completed"]')).toHaveCount(3, { timeout: 90000 });
  });

  test('Database connection failure', async ({ page }) => {
    // Simulate database connection failure
    await page.route('**/api/v1/projects', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Database connection failed',
          code: 'DB_CONNECTION_ERROR'
        })
      });
    });

    // Attempt to load projects
    await page.click('[data-testid="projects-tab"]');

    // Should show database error
    await expect(page.locator('[data-testid="database-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="database-error"]')).toContainText('Database connection failed');

    // Should show retry option
    await expect(page.locator('[data-testid="retry-database-btn"]')).toBeVisible();
  });

  test('Redis cache failure', async ({ page }) => {
    // Simulate Redis cache failure
    await page.route('**/api/v1/cache/**', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Cache service unavailable',
          code: 'CACHE_ERROR'
        })
      });
    });

    // Attempt to access cached data
    await page.click('[data-testid="recent-projects-tab"]');

    // Should fallback to database without cache
    await expect(page.locator('[data-testid="projects-list"]')).toBeVisible();
    
    // Should show cache warning but continue working
    await expect(page.locator('[data-testid="cache-warning"]')).toBeVisible();
  });

  test('Storage service failure', async ({ page }) => {
    // Simulate S3/MinIO storage failure
    await page.route('**/api/v1/storage/**', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Storage service unavailable',
          code: 'STORAGE_ERROR'
        })
      });
    });

    // Attempt to upload file
    const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-script.fdx');

    // Should show storage error
    await expect(page.locator('[data-testid="storage-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-error"]')).toContainText('Storage service unavailable');
  });

  test('Network latency simulation', async ({ page }) => {
    // Simulate high network latency
    await page.route('**/api/**', route => {
      route.continue({ delay: 5000 }); // 5 second delay
    });

    // Attempt to upload script
    const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-script.fdx');

    // Should show loading state
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    
    // Should eventually complete despite latency
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 60000 });
  });

  test('Memory pressure simulation', async ({ page }) => {
    // Simulate memory pressure by making large requests
    const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB

    await page.route('**/api/v1/scripts/parse', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: largeData
        })
      });
    });

    // Attempt to upload script
    const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-script.fdx');

    // Should handle large data gracefully
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
  });

  test('Concurrent user load', async ({ browser }) => {
    // Simulate multiple concurrent users
    const contexts = [];
    const pages = [];

    try {
      // Create 5 concurrent browser contexts
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      // Navigate all pages to the application
      await Promise.all(pages.map(page => page.goto('http://localhost:3000')));

      // All pages should load successfully
      await Promise.all(pages.map(page => 
        page.waitForSelector('[data-testid="script-upload"]')
      ));

      // Attempt concurrent uploads
      const uploadPromises = pages.map(async (page, index) => {
        const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
        await fileInput.setInputFiles(`tests/fixtures/sample-script-${index}.fdx`);
        return page.waitForSelector('[data-testid="upload-success"]', { timeout: 60000 });
      });

      // All uploads should complete successfully
      await Promise.all(uploadPromises);

    } finally {
      // Clean up contexts
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('Rate limiting behavior', async ({ page }) => {
    // Simulate rate limiting
    let requestCount = 0;
    await page.route('**/api/**', route => {
      requestCount++;
      if (requestCount > 10) {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 60
          })
        });
      } else {
        route.continue();
      }
    });

    // Make multiple rapid requests
    for (let i = 0; i < 15; i++) {
      await page.click('[data-testid="refresh-btn"]');
      await page.waitForTimeout(100);
    }

    // Should show rate limit error
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText('Rate limit exceeded');
  });

  test('Graceful degradation - JavaScript disabled', async ({ browser }) => {
    // Test with JavaScript disabled
    const context = await browser.newContext({
      javaScriptEnabled: false
    });
    const page = await context.newPage();

    try {
      await page.goto('http://localhost:3000');

      // Should show fallback content
      await expect(page.locator('[data-testid="no-js-fallback"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-js-fallback"]')).toContainText('JavaScript is required');

    } finally {
      await context.close();
    }
  });

  test('Browser compatibility - Different user agents', async ({ browser }) => {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ];

    for (const userAgent of userAgents) {
      const context = await browser.newContext({
        userAgent
      });
      const page = await context.newPage();

      try {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('[data-testid="script-upload"]');

        // Should work with all user agents
        await expect(page.locator('[data-testid="script-upload"]')).toBeVisible();

      } finally {
        await context.close();
      }
    }
  });
});
