import { test, expect } from '@playwright/test';

test.describe('Load Testing', () => {
  test('Concurrent script uploads', async ({ browser }) => {
    const contexts = [];
    const pages = [];

    try {
      // Create 10 concurrent browser contexts
      for (let i = 0; i < 10; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      // Navigate all pages to the application
      await Promise.all(pages.map(page => page.goto('http://localhost:3000')));
      await Promise.all(pages.map(page => 
        page.waitForSelector('[data-testid="script-upload"]')
      ));

      // Measure upload performance
      const startTime = Date.now();
      
      const uploadPromises = pages.map(async (page, index) => {
        const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
        await fileInput.setInputFiles(`tests/fixtures/sample-script-${index}.fdx`);
        return page.waitForSelector('[data-testid="upload-success"]', { timeout: 120000 });
      });

      await Promise.all(uploadPromises);
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / pages.length;

      // Performance assertions
      expect(totalTime).toBeLessThan(300000); // 5 minutes total
      expect(averageTime).toBeLessThan(30000); // 30 seconds average per upload

    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('Concurrent frame generation', async ({ browser }) => {
    const contexts = [];
    const pages = [];

    try {
      // Create 5 concurrent contexts
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      // Setup: Upload scripts and navigate to frame generation
      await Promise.all(pages.map(async (page, index) => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('[data-testid="script-upload"]');
        
        const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
        await fileInput.setInputFiles(`tests/fixtures/sample-script-${index}.fdx`);
        await page.waitForSelector('[data-testid="upload-success"]', { timeout: 60000 });
        
        await page.click('[data-testid="scene-item-0"]');
        await page.click('[data-testid="frames-tab"]');
        await page.click('[data-testid="select-all-shots"]');
      }));

      // Measure concurrent frame generation performance
      const startTime = Date.now();
      
      const generationPromises = pages.map(async (page) => {
        await page.click('[data-testid="batch-generate-frames-btn"]');
        return page.waitForSelector('[data-testid="frame-status-completed"]', { timeout: 180000 });
      });

      await Promise.all(generationPromises);
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / pages.length;

      // Performance assertions
      expect(totalTime).toBeLessThan(600000); // 10 minutes total
      expect(averageTime).toBeLessThan(120000); // 2 minutes average per batch

    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('Database connection pool stress', async ({ browser }) => {
    const contexts = [];
    const pages = [];

    try {
      // Create 20 concurrent contexts to stress database connections
      for (let i = 0; i < 20; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      // Navigate all pages and attempt to load projects simultaneously
      await Promise.all(pages.map(page => page.goto('http://localhost:3000')));
      
      const startTime = Date.now();
      
      const loadPromises = pages.map(async (page) => {
        await page.click('[data-testid="projects-tab"]');
        return page.waitForSelector('[data-testid="projects-list"]', { timeout: 30000 });
      });

      await Promise.all(loadPromises);
      
      const totalTime = Date.now() - startTime;

      // Should handle concurrent database connections gracefully
      expect(totalTime).toBeLessThan(60000); // 1 minute total
      
      // Verify all pages loaded successfully
      for (const page of pages) {
        await expect(page.locator('[data-testid="projects-list"]')).toBeVisible();
      }

    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('Memory usage under load', async ({ browser }) => {
    const contexts = [];
    const pages = [];

    try {
      // Create contexts and perform memory-intensive operations
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      // Upload large scripts simultaneously
      await Promise.all(pages.map(async (page, index) => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('[data-testid="script-upload"]');
        
        const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
        await fileInput.setInputFiles('tests/fixtures/large-script.fdx');
        await page.waitForSelector('[data-testid="upload-success"]', { timeout: 120000 });
      }));

      // Navigate through multiple scenes to load more data
      await Promise.all(pages.map(async (page) => {
        for (let i = 0; i < 3; i++) {
          await page.click(`[data-testid="scene-item-${i}"]`);
          await page.waitForTimeout(1000);
        }
      }));

      // Verify system remains responsive
      for (const page of pages) {
        await expect(page.locator('[data-testid="script-upload"]')).toBeVisible();
        await expect(page.locator('[data-testid="scenes-list"]')).toBeVisible();
      }

    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('API rate limiting under load', async ({ browser }) => {
    const contexts = [];
    const pages = [];

    try {
      // Create 15 concurrent contexts
      for (let i = 0; i < 15; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      // Navigate all pages
      await Promise.all(pages.map(page => page.goto('http://localhost:3000')));
      await Promise.all(pages.map(page => 
        page.waitForSelector('[data-testid="script-upload"]')
      ));

      // Make rapid API calls simultaneously
      const startTime = Date.now();
      
      const apiPromises = pages.map(async (page, index) => {
        // Simulate rapid API calls
        for (let i = 0; i < 5; i++) {
          await page.click('[data-testid="refresh-btn"]');
          await page.waitForTimeout(100);
        }
        return page.waitForSelector('[data-testid="projects-list"]', { timeout: 30000 });
      });

      await Promise.all(apiPromises);
      
      const totalTime = Date.now() - startTime;

      // Should handle rate limiting gracefully
      expect(totalTime).toBeLessThan(120000); // 2 minutes total

      // Check for rate limit errors (some may occur)
      let rateLimitErrors = 0;
      for (const page of pages) {
        const errorElement = page.locator('[data-testid="rate-limit-error"]');
        if (await errorElement.isVisible()) {
          rateLimitErrors++;
        }
      }

      // Should not have too many rate limit errors
      expect(rateLimitErrors).toBeLessThan(pages.length / 2);

    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('Worker queue stress test', async ({ browser }) => {
    const contexts = [];
    const pages = [];

    try {
      // Create 8 concurrent contexts
      for (let i = 0; i < 8; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      // Upload scripts and queue frame generation
      await Promise.all(pages.map(async (page, index) => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('[data-testid="script-upload"]');
        
        const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
        await fileInput.setInputFiles(`tests/fixtures/sample-script-${index}.fdx`);
        await page.waitForSelector('[data-testid="upload-success"]', { timeout: 60000 });
        
        await page.click('[data-testid="scene-item-0"]');
        await page.click('[data-testid="frames-tab"]');
        await page.click('[data-testid="select-all-shots"]');
      }));

      // Queue frame generation simultaneously
      const startTime = Date.now();
      
      const queuePromises = pages.map(async (page) => {
        await page.click('[data-testid="batch-generate-frames-btn"]');
        // Wait for queue confirmation
        await page.waitForSelector('[data-testid="frame-queued"]', { timeout: 30000 });
      });

      await Promise.all(queuePromises);
      
      const queueTime = Date.now() - startTime;

      // Queue should handle requests quickly
      expect(queueTime).toBeLessThan(60000); // 1 minute for queueing

      // Wait for some frames to complete
      await Promise.all(pages.map(async (page) => {
        await page.waitForSelector('[data-testid="frame-status-completed"]', { timeout: 300000 });
      }));

    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('Storage service load test', async ({ browser }) => {
    const contexts = [];
    const pages = [];

    try {
      // Create 6 concurrent contexts
      for (let i = 0; i < 6; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      // Upload large files simultaneously
      await Promise.all(pages.map(async (page, index) => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('[data-testid="script-upload"]');
        
        const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
        await fileInput.setInputFiles('tests/fixtures/large-script.fdx');
      }));

      const startTime = Date.now();
      
      // Wait for all uploads to complete
      const uploadPromises = pages.map(async (page) => {
        return page.waitForSelector('[data-testid="upload-success"]', { timeout: 180000 });
      });

      await Promise.all(uploadPromises);
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / pages.length;

      // Storage should handle concurrent uploads
      expect(totalTime).toBeLessThan(300000); // 5 minutes total
      expect(averageTime).toBeLessThan(50000); // 50 seconds average

    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  });
});
