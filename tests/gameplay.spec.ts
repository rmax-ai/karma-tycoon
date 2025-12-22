import { test, expect } from '@playwright/test';

test.describe('Karma Tycoon Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should increase karma when clicking "Create Content"', async ({ page }) => {
    const totalKarma = page.getByTestId('total-karma');
    const createBtn = page.getByTestId('create-content-btn');

    await expect(totalKarma).toHaveText('0');
    await createBtn.click();
    await expect(totalKarma).toHaveText('1');
    await createBtn.click();
    await expect(totalKarma).toHaveText('2');
  });

  test('should unlock a subreddit and increase KPS', async ({ page }) => {
    const totalKarma = page.getByTestId('total-karma');
    const createBtn = page.getByTestId('create-content-btn');
    
    // Need 10 karma for r/funny (assuming baseCost is 10)
    // Let's check the store to be sure of the cost, or just click 15 times.
    for (let i = 0; i < 15; i++) {
      await createBtn.click();
    }

    await expect(totalKarma).toHaveText(/1[0-5]/);

    const funnyUpgradeBtn = page.getByTestId('subreddit-upgrade-btn-r-funny');
    await expect(funnyUpgradeBtn).toBeEnabled();
    await funnyUpgradeBtn.click();

    // Level should be 1
    await expect(page.getByTestId('subreddit-level-r-funny')).toHaveText('Level 1');
    
    // KPS should be > 0
    const kps = page.getByTestId('subreddit-kps-r-funny');
    await expect(kps).not.toHaveText('0.0 KPS');
  });

  test('should persist state after refresh', async ({ page }) => {
    const createBtn = page.getByTestId('create-content-btn');
    
    for (let i = 0; i < 5; i++) {
      await createBtn.click();
    }

    await expect(page.getByTestId('total-karma')).toHaveText('5');

    await page.reload();

    await expect(page.getByTestId('total-karma')).toHaveText('5');
  });
});
