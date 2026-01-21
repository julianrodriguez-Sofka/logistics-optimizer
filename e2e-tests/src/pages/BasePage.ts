import { Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * BasePage - Base class for all Page Objects
 * Provides common functionality for screenshots, waiting, navigation
 */
export class BasePage {
  readonly page: Page;
  private screenshotCounter: number = 0;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Take a screenshot with automatic numbering
   */
  async takeScreenshot(name: string): Promise<void> {
    this.screenshotCounter++;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${this.screenshotCounter.toString().padStart(2, '0')}_${name}_${timestamp}.png`;
    const screenshotPath = path.join(process.cwd(), 'screenshots', fileName);
    
    // Ensure directory exists
    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await this.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
  }

  /**
   * Fill an input field
   */
  async fill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.click();
    await locator.fill(value);
  }

  /**
   * Click an element
   */
  async click(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.click();
  }

  /**
   * Wait for a locator to be visible
   */
  async waitForVisible(locator: Locator, timeout: number = 10000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Set checkbox state
   */
  async setCheckbox(locator: Locator, checked: boolean): Promise<void> {
    const isChecked = await locator.isChecked();
    if (isChecked !== checked) {
      await locator.click();
    }
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get text content from element
   */
  async getText(locator: Locator): Promise<string> {
    await this.waitForVisible(locator);
    return (await locator.textContent()) || '';
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
