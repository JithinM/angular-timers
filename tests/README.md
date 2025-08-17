# Playwright E2E Tests

This directory contains end-to-end tests for the Angular Timers application using Playwright.

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Angular CLI installed globally
- Playwright browsers installed

### Installation
```bash
# Install dependencies (including Playwright)
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Basic Test Commands
```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug
```

### Playwright CLI Commands
```bash
# Run specific test file
npx playwright test home.spec.ts

# Run tests matching a pattern
npx playwright test --grep "home"

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests with specific configuration
npx playwright test --config=playwright.config.ts
```

## Test Structure

### Test Files
- `home.spec.ts` - Tests for the home page and main navigation
- `stopwatch.spec.ts` - Tests for the stopwatch functionality
- `pomodoro.spec.ts` - Tests for the Pomodoro timer
- `global-setup.ts` - Global test setup and configuration
- `utils/test-helpers.ts` - Utility functions for common test operations

### Test Utilities
The `TestHelpers` class provides common functions:
- `waitForComponent()` - Wait for components to load
- `clickButton()` - Click buttons with flexible text matching
- `waitForTimerUpdate()` - Wait for timer values to change
- `takeScreenshot()` - Take timestamped screenshots
- `waitForNetworkIdle()` - Wait for network requests to complete

## Configuration

### Playwright Config (`playwright.config.ts`)
- **Base URL**: `http://localhost:4200`
- **Test Directory**: `./tests`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Web Server**: Automatically starts Angular dev server before tests
- **Reporting**: HTML reports with screenshots and videos on failure

### CI/CD Integration
GitHub Actions workflow (`.github/workflows/playwright.yml`) automatically runs tests on:
- Push to main/develop branches
- Pull requests to main/develop branches

## Writing Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices
1. **Use descriptive test names** that explain what is being tested
2. **Wait for elements** to be visible before interacting with them
3. **Use flexible selectors** that work with different button text variations
4. **Take screenshots** on failures for debugging
5. **Test user workflows** rather than just individual components
6. **Use test helpers** for common operations

### Locator Strategies
```typescript
// Flexible button selection
const startButton = page.locator('button:has-text("Start"), button:has-text("▶"), [data-testid="start-button"]').first();

// Component-based selectors
await expect(page.locator('app-stopwatch')).toBeVisible();

// Data attribute selectors (preferred when available)
await expect(page.locator('[data-testid="timer-display"]')).toBeVisible();
```

## Debugging

### UI Mode
```bash
npm run test:e2e:ui
```
Opens Playwright's interactive UI for debugging tests step by step.

### Debug Mode
```bash
npm run test:e2e:debug
```
Runs tests in debug mode with step-by-step execution.

### Screenshots and Videos
- Screenshots are automatically taken on test failures
- Videos are recorded and saved on failures
- All artifacts are uploaded to GitHub Actions

### Trace Viewer
```bash
npx playwright show-trace trace.zip
```
View detailed execution traces for debugging complex test scenarios.

## Continuous Integration

The GitHub Actions workflow:
1. Installs dependencies and Playwright browsers
2. Builds the Angular application
3. Runs all Playwright tests
4. Uploads test results, screenshots, and videos as artifacts
5. Provides detailed test reports for debugging

## Troubleshooting

### Common Issues
1. **Tests failing on CI**: Ensure all dependencies are properly installed
2. **Timing issues**: Use appropriate wait strategies and timeouts
3. **Selector failures**: Use flexible selectors that handle text variations
4. **Browser compatibility**: Test across different browsers and devices

### Getting Help
- Check Playwright documentation: https://playwright.dev/
- Review test reports and screenshots for debugging
- Use UI mode for interactive debugging
- Check GitHub Actions logs for CI issues
