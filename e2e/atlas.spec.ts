import { referenceScreenshot } from './referenceScreenshot';
import { test, expect, type Page } from '@playwright/test';
async function atlas(page: Page) {
  await page.goto('/atlas');
  await expect(page.getByRole('heading', { name: '에르덴 변경', exact: true })).toBeVisible();
  await expect(page.getByTestId('atlas-map')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toHaveCount(1);
}
test('atlas overview, LOD, mouse selection and mobile inspection', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await atlas(page);
  await expect(page.locator('.atlas-map-caption')).toContainText('16');
  const layerButton = page.getByRole('button', { name: /지도 레이어/ });
  if (await layerButton.isVisible()) await layerButton.click();
  await page.getByRole('button', { name: '통치권', exact: true }).click();
  await page.getByRole('button', { name: '소유권', exact: true }).click();
  if (await layerButton.isVisible()) await layerButton.click();
  await expect(page.locator('.atlas-map-readout')).toContainText('세계 관점');
  await referenceScreenshot(page, {
    path: 'docs/screenshots/atlas-overview-' + info.project.name + '.png',
  });
  await page.getByRole('button', { name: '영지 관점', exact: true }).click();
  await expect(page.locator('.atlas-map-readout')).toContainText('영지 관점');
  await page.getByRole('button', { name: '현장 관점', exact: true }).click();
  await expect(page.locator('.atlas-map-readout')).toContainText('현장 관점');
  await page.getByRole('combobox', { name: '영지', exact: true }).selectOption('A-07');
  await page.getByRole('button', { name: /구리빛 광산/ }).click();
  await expect(page.getByRole('heading', { name: '구리빛 광산', exact: true })).toBeVisible();
  await expect(page.locator('.atlas-inspector')).toBeInViewport();
  await referenceScreenshot(page, {
    path: 'docs/screenshots/atlas-local-' + info.project.name + '.png',
  });
  const canvas = page.locator('canvas'),
    box = await canvas.boundingBox();
  if (!box) throw Error('canvas missing');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByRole('heading', { name: '구리빛 광산', exact: true })).toBeVisible();
  if (info.project.name === 'mobile') {
    const session = await page.context().newCDPSession(page),
      before = await page.locator('.atlas-zoom span').innerText();
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: x - 25, y, id: 1 },
        { x: x + 25, y, id: 2 },
      ],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: x - 50, y, id: 1 },
        { x: x + 50, y, id: 2 },
      ],
    });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('.atlas-zoom span')).not.toHaveText(before);
    await session.detach();
  }
  expect(errors).toEqual([]);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
});
test('crown stewardship, distinct ownership and history across scenes', async ({ page }, info) => {
  await atlas(page);
  await expect(page.locator('.atlas-ownership')).toContainText('에르덴 왕실');
  await expect(page.locator('.atlas-ownership')).toContainText('새벽사슴 가문');
  await expect(page.locator('.atlas-metrics')).toContainText('30 일');
  await page.getByRole('tab', { name: '지도 객체', exact: true }).click();
  await page.getByRole('combobox', { name: '지도 객체', exact: true }).selectOption('city-1');
  await page.getByRole('button', { name: /성장과 번영/ }).click();
  await expect(page.locator('.atlas-object-hero')).toContainText('L4');
  await page.getByRole('button', { name: /변경의 분쟁/ }).click();
  await expect(page.locator('.atlas-object-hero')).toContainText('L4');
  await expect(page.locator('.atlas-object-hero')).toContainText('공성 중');
  await expect(page.locator('.atlas-ownership')).toContainText('새벽사슴 가문');
  await expect(page.locator('.atlas-ownership')).toContainText('붉은가시 가문');
  await referenceScreenshot(page, {
    path: 'docs/screenshots/atlas-conflict-' + info.project.name + '.png',
  });
  await page.getByRole('button', { name: /쇠퇴와 흔적/ }).click();
  await expect(page.locator('.atlas-object-hero')).toContainText('L4');
  await expect(page.locator('.atlas-object-hero')).toContainText('파손');
});
test('city variants, composed items, landless house and locale switching', async ({
  page,
}, info) => {
  await atlas(page);
  await page.getByRole('tab', { name: '지도 객체', exact: true }).click();
  await page.getByLabel('발전 레벨', { exact: true }).fill('1');
  await expect(page.locator('.atlas-object-hero')).toContainText('L1');
  await page.getByLabel('상태', { exact: true }).selectOption('burning');
  await expect(page.locator('.atlas-object-hero')).toContainText('화재');
  await page.getByRole('button', { name: '원래 외형', exact: true }).click();
  await expect(page.locator('.atlas-object-hero')).toContainText('L5');
  await page.getByRole('tab', { name: '아이템 시각화', exact: true }).click();
  await page.getByLabel('티어 · 본체', { exact: true }).fill('5');
  await page.getByLabel('등급 · 프레임', { exact: true }).selectOption('legendary');
  await page.getByLabel('강화 · 효과', { exact: true }).fill('15');
  await expect(page.locator('.atlas-item-name')).toContainText('T5 +15');
  await expect(page.getByTestId('atlas-item-visual').locator('.atlas-sprite')).toHaveCount(3);
  await referenceScreenshot(page, {
    path: 'docs/screenshots/atlas-items-' + info.project.name + '.png',
  });
  await page.getByRole('tab', { name: '가문', exact: true }).click();
  await page.getByRole('combobox', { name: '가문', exact: true }).selectOption('wanderer');
  await expect(page.locator('.atlas-inspector')).toContainText('영지 없이');
  await page.getByLabel('Language').selectOption('en');
  await expect(page.getByRole('heading', { name: 'The Erden Marches', exact: true })).toBeVisible();
  await page.getByLabel('Language').selectOption('ja');
  await expect(page.getByRole('heading', { name: 'エルデン辺境', exact: true })).toBeVisible();
});
test('layer filters, keyboard zoom and renderer remount', async ({ page }) => {
  await atlas(page);
  await page.getByRole('button', { name: '현장 관점', exact: true }).click();
  const before = await page.locator('.atlas-map-readout').innerText();
  const layerButton = page.getByRole('button', { name: /지도 레이어/ });
  if (await layerButton.isVisible()) await layerButton.click();
  await page.getByRole('checkbox', { name: '인물·운송', exact: true }).uncheck();
  await expect(page.locator('.atlas-map-readout')).not.toHaveText(before);
  await page.getByRole('checkbox', { name: '미개발 후보지', exact: true }).check();
  await page.locator('canvas').focus();
  await page.keyboard.press('-');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: /플레이 지도로/ }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto('/atlas');
  await expect(page.getByTestId('atlas-map')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toHaveCount(1);
});
test('missing atlas shows recoverable error rather than an empty map', async ({ page }) => {
  await page.route('**/assets/world/atlas/world-settlements.json', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.goto('/atlas');
  await expect(page.getByRole('alert')).toContainText('지도를 불러오지 못했습니다.');
  await page.unroute('**/assets/world/atlas/world-settlements.json');
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await expect(page.getByTestId('atlas-map')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toHaveCount(1);
});
