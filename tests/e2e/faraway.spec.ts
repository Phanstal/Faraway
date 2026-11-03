import { expect, test, type Page } from '@playwright/test';

async function enterFocus(page: Page) {
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('.landing-screen')).toBeVisible();
  await page.locator('.landing-screen').click({ position: { x: 180, y: 380 } });
  await expect(page.getByText('Stay with what matters.')).toBeVisible();
}

test('landing flows into a calm focus timer', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Enter Faraway' })).toBeVisible();
  await expect(page.getByText('Focus here.')).toBeVisible();
  await expect(page.getByText('Look farther.')).toBeVisible();

  await page.getByRole('button', { name: 'Enter Faraway' }).click();
  await expect(page.getByText('FOCUS TIME', { exact: true })).toBeVisible();
  await expect(page.getByText('20:00').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Focus' })).toBeVisible();

  const modeButton = page.getByRole('button', { name: 'Change focus mode' });
  await expect(modeButton).toContainText('Work');
  await modeButton.click();
  await page.locator('.mode-menu button', { hasText: 'Study' }).click();
  await expect(modeButton).toContainText('Study');
  await expect(page.locator('.focus-screen')).toHaveClass(/focus-study/);
});

test('a complete 20-20-20 cycle is recorded in insights and persists', async ({ page }) => {
  await enterFocus(page);

  await page.getByRole('button', { name: 'Start Focus' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change focus mode' })).toBeVisible();

  await page.clock.fastForward(20 * 60 * 1000);
  await expect(page.getByRole('button', { name: 'Start Break' })).toBeVisible();
  await expect(page.getByText('Look Beyond.')).toBeVisible();
  await expect(page.locator('.mode-selector')).toHaveClass(/mode-selector-hidden/);

  await page.getByRole('button', { name: 'Start Break' }).click();
  await expect(page.getByText('EYE BREAK')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip break' })).toBeVisible();

  await page.clock.fastForward(20 * 1000);
  await expect(page.getByText('COMPLETE')).toBeVisible();
  await expect(page.getByText("Lovely. You're ready to continue.")).toBeVisible();

  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Insights', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Insights' })).toBeVisible();
  await expect(page.locator('.total-stat .stat-value')).toHaveText('20m');
  await expect(page.locator('.today-stat .stat-value')).toHaveText('20m');
  await expect(page.locator('.mode-insight-row').first()).toContainText('20m');
  await expect(page.locator('.chart .bar-stack')).toHaveCount(7);
  await expect(page.locator('.chart .bar-stack .bar-segment.work')).toHaveCount(1);

  await page.reload();
  await page.locator('.landing-screen').click({ position: { x: 180, y: 380 } });
  await page.getByRole('button', { name: 'Insights', exact: true }).click();
  await expect(page.locator('.total-stat .stat-value')).toHaveText('20m');
});

test('pause freezes the countdown and resume continues it', async ({ page }) => {
  await enterFocus(page);

  await page.getByRole('button', { name: 'Start Focus' }).click();
  await page.clock.fastForward(5 * 60 * 1000);
  await expect(page.locator('.timer-value')).toHaveText('15:00');

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByText('PAUSED', { exact: true })).toBeVisible();
  await expect(page.getByText('Take your time.')).toBeVisible();
  await expect(page.locator('.timer-value')).toHaveText('15:00');

  await page.clock.fastForward(2 * 60 * 1000);
  await expect(page.locator('.timer-value')).toHaveText('15:00');

  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await page.clock.fastForward(15 * 60 * 1000);
  await expect(page.getByRole('button', { name: 'Start Break' })).toBeVisible();
});

test('stopping a focus session saves the elapsed minutes', async ({ page }) => {
  await enterFocus(page);
  await page.getByRole('button', { name: 'Start Focus' }).click();
  await page.clock.fastForward(70 * 1000);

  await page.getByRole('button', { name: 'Stop Focus' }).click();
  await expect(page.getByRole('dialog', { name: 'Stop this focus?' })).toBeVisible();
  await expect(
    page.getByText('Your focused time so far will be saved to your history.'),
  ).toBeVisible();
  await page.locator('.confirm-actions .confirm-stop-button').click();

  await expect(page.getByRole('button', { name: 'Start Focus' })).toBeVisible();
  await expect(page.locator('.timer-value')).toHaveText('20:00');

  await page.getByRole('button', { name: 'Insights', exact: true }).click();
  await expect(page.locator('.total-stat .stat-value')).toHaveText('1m');
  await expect(page.locator('.mode-insight-row').first()).toContainText('1m');
});

test('settings edits, adds and removes focus modes', async ({ page }) => {
  await enterFocus(page);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  const workInput = page.getByRole('textbox', { name: 'Edit Work mode name' });
  await expect(workInput).toHaveCSS('font-size', '16px');
  await workInput.fill('Deep Work');
  await workInput.press('Enter');

  await page.getByRole('button', { name: 'Remove Study mode' }).click();
  await expect(page.getByRole('button', { name: 'Add focus mode' })).toBeVisible();

  await page.getByRole('button', { name: 'Add focus mode' }).click();
  await page.getByRole('textbox', { name: 'New focus mode name' }).fill('Reading');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Edit Reading mode name' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add focus mode' })).toHaveCount(0);

  const reminderSwitch = page.getByRole('switch', { name: 'Eye-break reminders' });
  await expect(reminderSwitch).toHaveAttribute('aria-checked', 'true');
  await reminderSwitch.click();
  await expect(reminderSwitch).toHaveAttribute('aria-checked', 'false');

  await page.getByRole('button', { name: 'Back' }).click();
  const modeButton = page.getByRole('button', { name: 'Change focus mode' });
  await expect(modeButton).toContainText('Reading');
  await modeButton.click();
  await expect(page.locator('.mode-menu button', { hasText: 'Deep Work' })).toBeVisible();
});

test('resetting Faraway clears local history after two confirmations', async ({ page }) => {
  await enterFocus(page);
  await page.getByRole('button', { name: 'Start Focus' }).click();
  await page.clock.fastForward(70 * 1000);
  await page.getByRole('button', { name: 'Stop Focus' }).click();
  await page.locator('.confirm-actions .confirm-stop-button').click();
  await page.getByRole('button', { name: 'Insights', exact: true }).click();
  await expect(page.locator('.total-stat .stat-value')).toHaveText('1m');

  await page.getByRole('button', { name: 'Focus', exact: true }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.locator('.reset-section button').click();
  await expect(page.getByRole('dialog', { name: 'Reset Faraway?' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('dialog', { name: 'Are you absolutely sure?' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset Everything' }).click();

  await expect(page.getByRole('button', { name: 'Start Focus' })).toBeVisible();
  await page.getByRole('button', { name: 'Insights', exact: true }).click();
  await expect(page.locator('.total-stat .stat-value')).toHaveText('0m');
});

test('the timer can be resumed into a fresh interval from complete', async ({ page }) => {
  await enterFocus(page);
  await page.getByRole('button', { name: 'Start Focus' }).click();
  await page.clock.fastForward(20 * 60 * 1000);
  await page.getByRole('button', { name: 'Start Break' }).click();
  await page.getByRole('button', { name: 'Skip break' }).click();
  await expect(page.getByText('COMPLETE')).toBeVisible();

  await page.getByRole('button', { name: 'Resume Focus' }).click();
  await expect(page.getByText('FOCUS TIME', { exact: true })).toBeVisible();
  await expect(page.getByText('20:00').first()).toBeVisible();
});
