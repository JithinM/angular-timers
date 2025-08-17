import { Page, Locator } from '@playwright/test';

export class TestHelpers {
  /**
   * Wait for a component to be fully loaded and visible
   */
  static async waitForComponent(page: Page, selector: string, timeout = 5000): Promise<void> {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Click a button with flexible text matching
   */
  static async clickButton(page: Page, buttonText: string | RegExp): Promise<void> {
    const button = page.locator(`button:has-text("${buttonText}")`).first();
    await button.waitFor({ state: 'visible' });
    await button.click();
  }

  /**
   * Wait for timer to update (useful for testing timer functionality)
   */
  static async waitForTimerUpdate(page: Page, selector: string, initialValue: string): Promise<void> {
    await page.waitForFunction(
      (sel, initial) => {
        const element = document.querySelector(sel);
        return element && element.textContent !== initial;
      },
      selector,
      initialValue,
      { timeout: 10000 }
    );
  }

  /**
   * Check if element contains specific text
   */
  static async expectElementContainsText(locator: Locator, expectedText: string | RegExp): Promise<void> {
    await expect(locator).toContainText(expectedText);
  }

  /**
   * Take a screenshot with timestamp
   */
  static async takeScreenshot(page: Page, name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({ path: `screenshots/${name}-${timestamp}.png` });
  }

  /**
   * Wait for network requests to complete
   */
  static async waitForNetworkIdle(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
  }
}
