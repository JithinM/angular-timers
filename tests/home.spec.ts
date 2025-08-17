import { test, expect } from '@playwright/test';

/**
 * Home Page E2E Tests
 * 
 * IMPORTANT: These tests use specific selectors to avoid Playwright strict mode violations.
 * - Use .filter() and .first() for elements that might have multiple matches
 * - Combine multiple attributes for unique identification
 * - Use specific text content when generic selectors are ambiguous
 */

test.describe('Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Free Online Timers, Stopwatches & Tools/);
    
    // Check if main content is visible
    await expect(page.locator('app-home')).toBeVisible();
  });

  test('should display hero section with correct content', async ({ page }) => {
    await page.goto('/');
    
    // Check hero section
    const heroSection = page.locator('.hero-section');
    await expect(heroSection).toBeVisible();
    
    // Check hero title
    const heroTitle = page.locator('.hero-title');
    await expect(heroTitle).toHaveText('Free Online Timers, Stopwatches & Tools');
    
    // Check hero subtitle
    const heroSubtitle = page.locator('.hero-subtitle');
    await expect(heroSubtitle).toHaveText('Perfect timing tools for study, presentations, work and exercise');
  });

  test('should display featured timers section', async ({ page }) => {
    await page.goto('/');
    
    // Check featured section
    const featuredSection = page.locator('.featured-section');
    await expect(featuredSection).toBeVisible();
    
    // Check section heading
    const sectionHeading = page.locator('.heading-section');
    await expect(sectionHeading.first()).toHaveText('Quick Access Timers');
    
    // Check if stopwatch card is present
    const stopwatchCard = page.locator('.stopwatch-card');
    await expect(stopwatchCard).toBeVisible();
    
    // Check if countdown timer card is present
    const countdownCard = page.locator('.countdown-card');
    await expect(countdownCard).toBeVisible();
  });

  test('should display embedded stopwatch functionality', async ({ page }) => {
    await page.goto('/');
    
    // Wait for stopwatch card to be visible
    const stopwatchCard = page.locator('.stopwatch-card');
    await expect(stopwatchCard).toBeVisible();
    
    // Check stopwatch title
    const stopwatchTitle = stopwatchCard.locator('mat-card-title');
    await expect(stopwatchTitle).toContainText('Stopwatch');
    
    // Check if time display component is present
    const timeDisplay = stopwatchCard.locator('app-time-display');
    await expect(timeDisplay).toBeVisible();
    
    // Check if control buttons are present
    const controlButtons = stopwatchCard.locator('app-control-buttons');
    await expect(controlButtons).toBeVisible();
    
    // Check if full view button is present
    const fullViewButton = stopwatchCard.locator('button:has-text("Full View")');
    await expect(fullViewButton).toBeVisible();
  });

  test('should display embedded countdown timer functionality', async ({ page }) => {
    await page.goto('/');
    
    // Wait for countdown card to be visible
    const countdownCard = page.locator('.countdown-card');
    await expect(countdownCard).toBeVisible();
    
    // Check countdown title
    const countdownTitle = countdownCard.locator('mat-card-title');
    await expect(countdownTitle).toContainText('Countdown Timer');
    
    // Check if preset buttons are present
    const presetButtons = countdownCard.locator('.btn--preset');
    await expect(presetButtons).toHaveCount(4);
    
    // Check specific preset values
    await expect(presetButtons.nth(0)).toHaveText('1m');
    await expect(presetButtons.nth(1)).toHaveText('5m');
    await expect(presetButtons.nth(2)).toHaveText('10m');
    await expect(presetButtons.nth(3)).toHaveText('25m');
    
    // Check if time display component is present
    const timeDisplay = countdownCard.locator('app-time-display');
    await expect(timeDisplay).toBeVisible();
    
    // Check if control buttons are present
    const controlButtons = countdownCard.locator('app-control-buttons');
    await expect(controlButtons).toBeVisible();
    
    // Check if full view button is present
    const fullViewButton = countdownCard.locator('button:has-text("Full View")');
    await expect(fullViewButton).toBeVisible();
  });

  test('should display all timer tools section', async ({ page }) => {
    await page.goto('/');
    
    // Check tools section
    const toolsSection = page.locator('.tools-section');
    await expect(toolsSection).toBeVisible();
    
    // Check section heading
    const sectionHeading = page.locator('.tools-section .heading-section');
    await expect(sectionHeading).toHaveText('All Timer Tools');
    
    // Check if tool cards are present (should be multiple)
    const toolCards = page.locator('.tool-card');
    const toolCount = await toolCards.count();
    expect(toolCount).toBeGreaterThan(0); // Should have at least some tools
    
    // Check specific tool cards - use more specific selectors to avoid ambiguity
    const basicStopwatchCard = page.locator('.tool-card').filter({ hasText: 'Basic Stopwatch' }).first();
    await expect(basicStopwatchCard).toBeVisible();
    
    // Use the exact text match for Countdown Timer to avoid conflicts with other "Timer" cards
    // Look for the card that has both "Countdown Timer" title and the specific description
    const countdownTimerCard = page.locator('.tool-card').filter({ hasText: 'Countdown Timer' }).filter({ hasText: 'Set a specific time and count down with audio alerts' }).first();
    await expect(countdownTimerCard).toBeVisible();
    
    const pomodoroCard = page.locator('.tool-card').filter({ hasText: 'Pomodoro Timer' }).first();
    await expect(pomodoroCard).toBeVisible();
  });

  test('should display featured and popular badges on tools', async ({ page }) => {
    await page.goto('/');
    
    // Check featured badge on Basic Stopwatch
    const basicStopwatchCard = page.locator('.tool-card').filter({ hasText: 'Basic Stopwatch' }).first();
    const featuredBadge = basicStopwatchCard.locator('mat-chip:has-text("Featured")');
    await expect(featuredBadge).toBeVisible();
    
    // Check popular badge on Basic Stopwatch
    const popularBadge = basicStopwatchCard.locator('mat-chip:has-text("Popular")');
    await expect(popularBadge).toBeVisible();
    
    // Check popular badge on Countdown Timer - use exact text match
    // Look for the card that has both "Countdown Timer" title and the specific description
    const countdownCard = page.locator('.tool-card').filter({ hasText: 'Countdown Timer' }).filter({ hasText: 'Set a specific time and count down with audio alerts' }).first();
    const countdownPopularBadge = countdownCard.locator('mat-chip:has-text("Popular")');
    await expect(countdownPopularBadge).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check if navigation elements are present
    const nav = page.locator('nav, [role="navigation"]');
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
    }
    
    // Check if router links are working by verifying they have routerLink attributes
    const stopwatchLink = page.locator('.stopwatch-card button[routerLink="/stopwatch"]');
    await expect(stopwatchLink).toBeVisible();
    
    const countdownLink = page.locator('.countdown-card button[routerLink="/timer"]');
    await expect(countdownLink).toBeVisible();
  });

  

  test('should display recent activity section when available', async ({ page }) => {
    await page.goto('/');
    
    // The recent activity section is conditionally displayed based on recentHistory.length
    // We'll check if the section exists and handle both cases
    const recentSection = page.locator('.recent-section');
    
    if (await recentSection.count() > 0) {
      // If recent activity exists, check the structure
      await expect(recentSection).toBeVisible();
      
      const sectionTitle = recentSection.locator('.section-title');
      await expect(sectionTitle).toHaveText('Recent Activity');
      
      const recentItems = recentSection.locator('.recent-item');
      const recentCount = await recentItems.count();
      expect(recentCount).toBeGreaterThan(0);
    }
    // If no recent activity, the section won't be visible, which is expected
  });

  test('should have proper Material Design components', async ({ page }) => {
    await page.goto('/');
    
    // Check if Material Design components are properly rendered
    const matCards = page.locator('mat-card');
    const cardCount = await matCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    const matIcons = page.locator('mat-icon');
    const iconCount = await matIcons.count();
    expect(iconCount).toBeGreaterThan(0);
    
    const matButtons = page.locator('button[mat-button]');
    const buttonCount = await matButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });
});
