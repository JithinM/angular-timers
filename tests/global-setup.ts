import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  
  // Launch browser and create a new context
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to the application
  await page.goto(baseURL!);
  
  // Wait for the application to load
  await page.waitForLoadState('networkidle');
  
  // You can add authentication logic here if needed
  // For example, if your app requires login:
  // await page.fill('[data-testid="username"]', 'testuser');
  // await page.fill('[data-testid="password"]', 'testpass');
  // await page.click('[data-testid="login-button"]');
  
  // Save signed-in state
  await page.context().storageState({ path: storageState as string });
  await browser.close();
}

export default globalSetup;
