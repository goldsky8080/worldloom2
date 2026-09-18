import { referenceScreenshot } from './referenceScreenshot';
import { test, expect, type Page } from '@playwright/test';
async function fief(page: Page, pause = true) {
  await page.goto('/fief');
  await expect(page.getByRole('heading', { name: '새벽물결 영지', exact: true })).toBeVisible();
  await page.getByTestId('fief-dev-toggle').click();
  if (pause) await page.getByRole('button', { name: '시간 일시정지', exact: true }).click();
}
test('fief starts at L1 with one permanent dungeon and responsive interactive facilities', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await fief(page);
  await expect(page.getByTestId('fief-grade')).toHaveText('F');
  await expect(page.getByTestId('fief-grade-range')).toHaveText('F ~ D');
  await expect(page.locator('.fief-site')).toHaveCount(4);
  await expect(page.getByRole('combobox', { name: '도시 레벨 · 테스트', exact: true })).toHaveValue(
    '1',
  );
  await expect(page.getByRole('combobox', { name: '성 레벨 · 테스트', exact: true })).toHaveValue(
    '1',
  );
  await page.getByTestId('fief-dev-toggle').click();
  await page.getByRole('button', { name: '장원', exact: true }).click();
  await expect(page.getByTestId('fief-context')).toContainText('장원 L1');
  await expect
    .poll(() =>
      page
        .locator('.fief-site .atlas-sprite')
        .evaluateAll((elements) =>
          elements.every((e) => getComputedStyle(e).backgroundImage !== 'none'),
        ),
    )
    .toBe(true);
  await expect(page.getByTestId('fief-map')).toHaveAttribute(
    'data-dungeon-id',
    'dungeon-ancient-palace',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const host = page.getByTestId('fief-page');
  if (await host.evaluate((element) => element.scrollHeight > element.clientHeight)) {
    await host.hover();
    await page.mouse.wheel(0, 1800);
    await expect.poll(() => host.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  }
  await page.getByTestId('fief-page').evaluate((element) => {
    element.scrollTop = 0;
  });
  await referenceScreenshot(page, {
    path: 'docs/screenshots/fief-overview-' + info.project.name + '.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test('city grade ranges apply on the next cycle, forecast and castle independence', async ({
  page,
}, info) => {
  await fief(page);
  const city = page.getByRole('combobox', { name: '도시 레벨 · 테스트', exact: true });
  await city.selectOption('5');
  await expect(page.getByTestId('fief-grade')).toHaveText('F');
  await expect(page.getByTestId('fief-grade-range')).toHaveText('B ~ S');
  await page.getByRole('button', { name: /다음 주기 실행/ }).click();
  await expect(page.getByTestId('fief-grade')).toHaveText('A');
  await page.getByRole('button', { name: /다음 주기 실행/ }).click();
  await expect(page.getByTestId('fief-grade')).toHaveText('S');
  await page.getByTestId('fief-dev-toggle').click();
  await page.getByRole('button', { name: '성', exact: true }).click();
  await expect(page.getByTestId('fief-garrison')).toHaveText('40 / 80');
  await page.getByTestId('fief-dev-toggle').click();
  await page.getByRole('combobox', { name: '성 레벨 · 테스트', exact: true }).selectOption('5');
  await expect(page.getByTestId('fief-grade')).toHaveText('S');
  await expect(page.getByTestId('fief-garrison')).toHaveText('40 / 240');
  await city.selectOption('1');
  await page.getByTestId('fief-dev-toggle').click();
  await page.getByRole('button', { name: '영지 던전', exact: true }).click();
  await page.getByTestId('fief-dev-toggle').click();
  await expect(page.getByTestId('fief-grade')).toHaveText('S');
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: '시간 +30초', exact: true }).click();
  await expect(page.getByTestId('fief-forecast')).toContainText('다음 등급 예고 · F');
  await page.getByRole('button', { name: /다음 주기 실행/ }).click();
  await expect(page.getByTestId('fief-grade')).toHaveText('F');
  await referenceScreenshot(page, {
    path: 'docs/screenshots/fief-cycle-' + info.project.name + '.png',
    fullPage: true,
  });
});
test('aether rises, break latches once, raid recovers and reset clears state', async ({
  page,
}, info) => {
  await fief(page);
  for (let i = 0; i < 5; i++)
    await page.getByRole('button', { name: '시간 +30초', exact: true }).click();
  await expect(page.getByTestId('fief-break-alert')).toBeVisible();
  await expect(page.getByTestId('fief-aether-value')).toHaveText('100.0 / 100');
  await expect(page.getByTestId('fief-break-count')).toHaveText('1');
  await page.getByRole('button', { name: '시간 +30초', exact: true }).click();
  await expect(page.getByTestId('fief-break-count')).toHaveText('1');
  await page.getByTestId('fief-page').evaluate((element) => {
    element.scrollTop = 0;
  });
  await referenceScreenshot(page, {
    path: 'docs/screenshots/fief-break-' + info.project.name + '.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: /즉시 공략/ }).click();
  await expect(page.getByTestId('fief-break-alert')).toHaveCount(0);
  await expect(page.getByTestId('fief-aether-value')).toHaveText('65.0 / 100');
  await expect(page.getByTestId('fief-status')).toHaveText('위험');
  await page.getByRole('button', { name: /즉시 공략/ }).click();
  await page.getByRole('button', { name: /즉시 공략/ }).click();
  await expect(page.getByTestId('fief-aether-value')).toHaveText('0.0 / 100');
  await expect(page.getByRole('button', { name: /즉시 공략/ })).toBeDisabled();
  await page.getByRole('button', { name: '영지 초기화', exact: true }).click();
  await page.getByRole('button', { name: '시간 일시정지', exact: true }).click();
  await expect(page.getByTestId('fief-grade')).toHaveText('F');
  await expect(page.getByTestId('fief-break-count')).toHaveText('0');
});
test('visible clock updates naturally and pause stops both aether and cycle', async ({ page }) => {
  await page.clock.install();
  await fief(page, false);
  await page.clock.runFor(31000);
  const before = Number((await page.getByTestId('fief-aether-value').innerText()).split('/')[0]);
  expect(before).toBeGreaterThan(29);
  const visible = await page.getByTestId('fief-aether-value').innerText();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(60000);
  await expect(page.getByTestId('fief-aether-value')).toHaveText(visible);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByRole('button', { name: '시간 일시정지', exact: true }).click();
  const paused = await page.getByTestId('fief-aether-value').innerText();
  await page.clock.runFor(60000);
  await expect(page.getByTestId('fief-aether-value')).toHaveText(paused);
  await page.getByRole('button', { name: '시간 재개', exact: true }).click();
  await page.clock.runFor(91000);
  await expect(page.getByTestId('fief-grade')).toHaveText('E');
});
test('design mode stays separate and all supported languages render', async ({ page }) => {
  await page.clock.install();
  await fief(page);
  await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  await page.getByTestId('fief-dev-reset').click();
  await page.getByTestId('fief-dev-pause').click();
  await page.getByRole('button', { name: '시간 +30초', exact: true }).click();
  await page
    .getByRole('combobox', { name: '개발용 시간 조작', exact: true })
    .selectOption('design');
  await expect(page.getByTestId('fief-countdown')).toHaveText('15d 18h');
  const locale = page.locator('.fief-header select');
  const names = {
    en: 'Dawnwater Fief',
    ja: '暁の領地',
    'zh-CN': '晨水领地',
    vi: 'Lãnh địa Bình Minh',
    ko: '새벽물결 영지',
  };
  for (const [key, name] of Object.entries(names)) {
    await locale.selectOption(key);
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
});
test('atlas link round trip resets fief and cleans up its clock', async ({ page }) => {
  await fief(page);
  await page.getByRole('combobox', { name: '도시 레벨 · 테스트', exact: true }).selectOption('5');
  await page.getByRole('link', { name: '월드 아틀라스 ↗', exact: true }).click();
  await expect(page.getByTestId('atlas-map')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.getByRole('link', { name: '영지 관리 ↗', exact: true }).click();
  await expect(page.getByTestId('fief-page')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByTestId('fief-dev-toggle').click();
  await expect(page.getByRole('combobox', { name: '도시 레벨 · 테스트', exact: true })).toHaveValue(
    '1',
  );
  await page.reload();
  await expect(page.getByTestId('fief-grade')).toHaveText('F');
});
