import { test, expect } from '@playwright/test';

test.describe('Storyboard Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="script-upload"]');
  });

  test('Complete storyboard workflow: upload → generate → edit → export', async ({ page }) => {
    // Step 1: Upload screenplay
    await test.step('Upload screenplay', async () => {
      const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
      await fileInput.setInputFiles('tests/fixtures/sample-script.fdx');
      
      // Wait for upload to complete
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
    });

    // Step 2: Wait for script parsing and scene generation
    await test.step('Wait for script parsing', async () => {
      await expect(page.locator('[data-testid="parsing-status"]')).toContainText('completed');
      await expect(page.locator('[data-testid="scenes-list"]')).toBeVisible();
    });

    // Step 3: Navigate to first scene and generate shots
    await test.step('Generate shots for first scene', async () => {
      await page.click('[data-testid="scene-item-0"]');
      await page.click('[data-testid="shot-planning-tab"]');
      
      // Select dialogue-heavy template
      await page.selectOption('[data-testid="shot-template-select"]', 'dialogue-heavy');
      await page.click('[data-testid="generate-shots-btn"]');
      
      // Wait for shot generation
      await expect(page.locator('[data-testid="shots-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="shot-item"]')).toHaveCount(3, { timeout: 30000 });
    });

    // Step 4: Generate frames for shots
    await test.step('Generate frames for shots', async () => {
      await page.click('[data-testid="frames-tab"]');
      
      // Select all shots for batch generation
      await page.click('[data-testid="select-all-shots"]');
      await page.selectOption('[data-testid="style-preset-select"]', 'storyboard');
      await page.click('[data-testid="batch-generate-frames-btn"]');
      
      // Wait for frame generation
      await expect(page.locator('[data-testid="frame-item"]')).toHaveCount(3, { timeout: 60000 });
      await expect(page.locator('[data-testid="frame-status-completed"]')).toHaveCount(3, { timeout: 90000 });
    });

    // Step 5: Edit dialogue timing
    await test.step('Edit dialogue timing', async () => {
      await page.click('[data-testid="dialogue-timing-tab"]');
      
      // Adjust speaking rate
      await page.fill('[data-testid="speaking-rate-input"]', '150');
      await page.click('[data-testid="estimate-timing-btn"]');
      
      // Verify timing updates
      await expect(page.locator('[data-testid="total-duration"]')).toContainText('2:30');
    });

    // Step 6: Create animatic
    await test.step('Create animatic', async () => {
      await page.click('[data-testid="animatics-tab"]');
      await page.click('[data-testid="create-animatic-btn"]');
      
      // Configure animatic settings
      await page.selectOption('[data-testid="animatic-format-select"]', 'mp4');
      await page.check('[data-testid="include-captions-checkbox"]');
      await page.fill('[data-testid="frame-duration-input"]', '3');
      await page.click('[data-testid="generate-animatic-btn"]');
      
      // Wait for animatic generation
      await expect(page.locator('[data-testid="animatic-status-completed"]')).toBeVisible({ timeout: 120000 });
    });

    // Step 7: Export project
    await test.step('Export project', async () => {
      await page.click('[data-testid="exports-tab"]');
      await page.click('[data-testid="create-export-btn"]');
      
      // Configure export settings
      await page.selectOption('[data-testid="export-format-select"]', 'pdf');
      await page.selectOption('[data-testid="pdf-layout-select"]', 'booklet');
      await page.check('[data-testid="include-frames-checkbox"]');
      await page.check('[data-testid="include-metadata-checkbox"]');
      await page.click('[data-testid="generate-export-btn"]');
      
      // Wait for export generation
      await expect(page.locator('[data-testid="export-status-completed"]')).toBeVisible({ timeout: 60000 });
      
      // Download the export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-export-btn"]');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });

    // Step 8: Verify project statistics
    await test.step('Verify project statistics', async () => {
      await page.click('[data-testid="project-overview-tab"]');
      
      await expect(page.locator('[data-testid="total-scenes"]')).toContainText('1');
      await expect(page.locator('[data-testid="total-shots"]')).toContainText('3');
      await expect(page.locator('[data-testid="total-frames"]')).toContainText('3');
      await expect(page.locator('[data-testid="total-duration"]')).toContainText('2:30');
    });
  });

  test('Error handling and recovery', async ({ page }) => {
    // Test invalid file upload
    await test.step('Handle invalid file upload', async () => {
      const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
      await fileInput.setInputFiles('tests/fixtures/invalid-file.txt');
      
      await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-error"]')).toContainText('Unsupported file format');
    });

    // Test network error recovery
    await test.step('Handle network errors', async () => {
      // Simulate network error by intercepting API calls
      await page.route('**/api/v1/scripts/parse', route => {
        route.abort('failed');
      });
      
      const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
      await fileInput.setInputFiles('tests/fixtures/sample-script.fdx');
      
      await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
      
      // Restore network and retry
      await page.unroute('**/api/v1/scripts/parse');
      await page.click('[data-testid="retry-btn"]');
      
      await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
    });
  });

  test('Accessibility compliance', async ({ page }) => {
    // Test keyboard navigation
    await test.step('Keyboard navigation', async () => {
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="script-upload"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="main-navigation"]')).toBeFocused();
    });

    // Test screen reader labels
    await test.step('Screen reader labels', async () => {
      const uploadButton = page.locator('[data-testid="script-upload"]');
      await expect(uploadButton).toHaveAttribute('aria-label', 'Upload script file');
      
      const generateButton = page.locator('[data-testid="generate-shots-btn"]');
      await expect(generateButton).toHaveAttribute('aria-label', 'Generate shots for scene');
    });

    // Test high contrast mode
    await test.step('High contrast mode', async () => {
      await page.click('[data-testid="accessibility-toggle"]');
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
      
      // Verify high contrast styles are applied
      const button = page.locator('[data-testid="generate-shots-btn"]');
      await expect(button).toHaveCSS('border-width', '2px');
      await expect(button).toHaveCSS('border-color', 'rgb(255, 255, 255)');
    });
  });

  test('Performance and load testing', async ({ page }) => {
    // Test with large script
    await test.step('Large script processing', async () => {
      const fileInput = page.locator('[data-testid="script-upload"] input[type="file"]');
      await fileInput.setInputFiles('tests/fixtures/large-script.fdx');
      
      // Measure upload time
      const startTime = Date.now();
      await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 60000 });
      const uploadTime = Date.now() - startTime;
      
      // Upload should complete within 60 seconds
      expect(uploadTime).toBeLessThan(60000);
    });

    // Test concurrent operations
    await test.step('Concurrent operations', async () => {
      // Start multiple frame generations simultaneously
      await page.click('[data-testid="select-all-shots"]');
      await page.click('[data-testid="batch-generate-frames-btn"]');
      
      // Navigate to another scene and start another batch
      await page.click('[data-testid="scene-item-1"]');
      await page.click('[data-testid="frames-tab"]');
      await page.click('[data-testid="select-all-shots"]');
      await page.click('[data-testid="batch-generate-frames-btn"]');
      
      // Both operations should complete successfully
      await expect(page.locator('[data-testid="frame-status-completed"]')).toHaveCount(6, { timeout: 120000 });
    });
  });
});
