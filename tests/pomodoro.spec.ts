import { test, expect } from '@playwright/test';

test.describe('Pomodoro Timer', () => {
  test('should display pomodoro timer page', async ({ page }) => {
    await page.goto('/timer/pomodoro');
    
    // Wait for pomodoro component to be visible
    await expect(page.locator('.pomodoro-container')).toBeVisible();
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Pomodoro Timer/);
    
    // Check if pomodoro title is present
    const pomodoroTitle = page.locator('.pomodoro-title');
    await expect(pomodoroTitle).toHaveText('Pomodoro Timer');
  });

  test('should display pomodoro setup mode', async ({ page }) => {
    await page.goto('/timer/pomodoro');
    
    // Wait for pomodoro component
    await expect(page.locator('.pomodoro-container')).toBeVisible();
    
    // Check if setup mode is visible
    const setupMode = page.locator('.pomodoro-setup');
    await expect(setupMode).toBeVisible();
    
    // Check if presets section is present
    const presetsSection = page.locator('.presets-section');
    await expect(presetsSection).toBeVisible();
    
    // Check if custom setup section is present
    const customSetupSection = page.locator('.custom-setup-section');
    await expect(customSetupSection).toBeVisible();
  });

  test('should display quick start presets', async ({ page }) => {
    await page.goto('/timer/pomodoro');
    
    // Wait for pomodoro component
    await expect(page.locator('.pomodoro-container')).toBeVisible();
    
    // Check if preset cards are present
    const presetCards = page.locator('.preset-card');
    const presetCount = await presetCards.count();
    expect(presetCount).toBeGreaterThan(0);
    
    // Check if preset grid is visible
    const presetGrid = page.locator('.preset-grid');
    await expect(presetGrid).toBeVisible();
  });

  test('should display custom configuration options', async ({ page }) => {
    await page.goto('/timer/pomodoro');
    
    // Wait for pomodoro component
    await expect(page.locator('.pomodoro-container')).toBeVisible();
    
    // Check if custom setup cards are present
    const setupCards = page.locator('.setup-card');
    const setupCardCount = await setupCards.count();
    expect(setupCardCount).toBeGreaterThan(0);
    
    // Check if work time input is present
    const workTimeInput = page.locator('input[type="number"]').filter({ hasText: '' }).first();
    await expect(workTimeInput).toBeVisible();
  });

  test('should have fullscreen toggle functionality', async ({ page }) => {
    await page.goto('/timer/pomodoro');
    
    // Wait for pomodoro component
    await expect(page.locator('.pomodoro-container')).toBeVisible();
    
    // Check if fullscreen toggle button is present
    const fullscreenButton = page.locator('button[title*="Toggle Fullscreen"]');
    await expect(fullscreenButton).toBeVisible();
    
    // Check if fullscreen icon is present
    const fullscreenIcon = fullscreenButton.locator('mat-icon');
    await expect(fullscreenIcon).toBeVisible();
  });

  

  test('should have proper Material Design components', async ({ page }) => {
    await page.goto('/timer/pomodoro');
    
    // Wait for pomodoro component
    await expect(page.locator('.pomodoro-container')).toBeVisible();
    
    // Check if Material Design components are properly rendered
    const matCards = page.locator('mat-card');
    const cardCount = await matCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    const matIcons = page.locator('mat-icon');
    const iconCount = await matIcons.count();
    expect(iconCount).toBeGreaterThan(0);
    
    const matButtons = page.locator('button[mat-icon-button]');
    const buttonCount = await matButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });
});
