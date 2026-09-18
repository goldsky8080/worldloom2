import { test, expect, type Page, type TestInfo } from '@playwright/test';
test.use({
  launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: ['--enable-unsafe-swiftshader'],
  },
});
async function enter(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: '월드 접속', exact: true }).click();
  await expect(page.getByRole('heading', { name: '푸른 변경 지대', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.world-loading')).toHaveCount(0);
}
async function open(page: Page, category: string, name: string) {
  const button = page.getByRole('button', { name: category, exact: true });
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
  await page
    .getByRole('navigation', { name: category, exact: true })
    .getByRole('button', { name, exact: true })
    .click();
}
async function storage(page: Page) {
  await open(page, '경제', '저장·물류');
  return page.getByRole('dialog', { name: '저장·물류', exact: true });
}
async function visit(page: Page) {
  await page.getByRole('button', { name: '이 도시로 이동', exact: true }).click();
  await expect(page.getByTestId('storage-location')).toContainText('도시 도착', { timeout: 15000 });
}
async function capture(page: Page, name: string, info: TestInfo) {
  await page.screenshot({
    path: 'docs/screenshots/storage-v04a-' + name + '-' + info.project.name + '.png',
    animations: 'disabled',
  });
}
test('inventory capacity uses stacks and weight and charges sequential Gold expansions', async ({
  page,
}, info) => {
  await enter(page);
  await open(page, '경제', '인벤토리');
  await expect(page.getByTestId('inventory-slots')).toContainText('3 / 20');
  await expect(page.getByTestId('inventory-weight')).toHaveText('무게: 36 / 120');
  await page.getByTestId('inventory-expand-gold').click();
  await expect(page.getByTestId('inventory-slots')).toContainText('3 / 23');
  await expect(page.locator('.hud .resource-badge')).toContainText('950');
  await page.getByTestId('inventory-expand-gold').click();
  await expect(page.getByTestId('inventory-slots')).toContainText('3 / 26');
  await expect(page.locator('.hud .resource-badge')).toContainText('350');
  await expect(page.getByTestId('inventory-expand-gold')).toBeDisabled();
  await expect(page.getByRole('button', { name: /Gem으로 슬롯 확장/ })).toBeDisabled();
  await capture(page, 'inventory', info);
  await page.getByRole('button', { name: '저장·물류', exact: true }).last().click();
  await expect(page.getByTestId('storage-deposit')).toBeDisabled();
});
test('warehouse visit, partial transfers, independent expansion and receiving limits', async ({
  page,
}, info) => {
  await enter(page);
  const panel = await storage(page);
  await expect(page.getByTestId('storage-deposit')).toBeDisabled();
  await expect(page.getByTestId('storage-warehouse-stock')).toHaveCount(0);
  await visit(page);
  await expect(page.getByTestId('storage-warehouse-stock')).toContainText('80');
  await page.getByTestId('storage-count').fill('10');
  await page.getByTestId('storage-deposit').click();
  await expect(page.getByTestId('storage-warehouse-stock')).toContainText('90');
  await expect(page.getByTestId('storage-personal')).toContainText('×2');
  await page.getByTestId('storage-withdraw').click();
  await expect(page.getByTestId('storage-personal')).toContainText('×12');
  await page.getByTestId('storage-count').fill('43');
  await expect(page.getByTestId('storage-withdraw')).toBeDisabled();
  await page.getByTestId('storage-count').fill('1.5');
  await expect(page.getByTestId('storage-deposit')).toBeDisabled();
  await page.getByTestId('storage-count').fill('10');
  await page.getByTestId('warehouse-expand-gold').click();
  await expect(page.getByTestId('warehouse-slots')).toContainText('1 / 23');
  await capture(page, 'warehouse', info);
  await page.getByTestId('storage-city').selectOption('harbor');
  await expect(panel).toContainText('해당 도시에 도착');
  await expect(page.getByTestId('storage-warehouse-stock')).toHaveCount(0);
  await visit(page);
  await expect(page.getByTestId('warehouse-slots')).toContainText('0 / 20');
  expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});
test('NPC shipment arrives at destination depot and Mail links to local partial collection', async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await enter(page);
  await storage(page);
  await visit(page);
  await page.getByTestId('storage-tab-logistics').click();
  await page.getByTestId('storage-count').fill('20');
  await expect(page.getByTestId('storage-quote')).toContainText('비용 20 G');
  await page.getByTestId('storage-ship').click();
  await expect(page.getByTestId('storage-shipments')).toContainText('배송 중');
  await expect(page.locator('.hud .resource-badge')).toContainText('1,230');
  await capture(page, 'shipment', info);
  await expect(page.getByTestId('storage-shipments')).toContainText('도착 완료', {
    timeout: 20000,
  });
  await open(page, '소셜', '우편');
  const mail = page.getByRole('dialog', { name: '우편', exact: true });
  await mail.getByRole('button', { name: /배송 물품 도착/ }).click();
  await expect(mail).toContainText('항구 도시 거래보관소');
  await expect(mail.getByRole('button', { name: '보상 수령', exact: true })).toHaveCount(0);
  await mail.getByRole('button', { name: '저장·물류 열기', exact: true }).click();
  await expect(page.getByTestId('storage-city')).toHaveValue('harbor');
  await expect(page.getByTestId('storage-tab-depot')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('storage-collect')).toBeDisabled();
  await visit(page);
  await expect(page.getByTestId('storage-depot-batches')).toContainText('×20');
  await page.getByTestId('storage-count').fill('7');
  await page.getByTestId('storage-collect').click();
  await expect(page.getByTestId('storage-depot-batches')).toContainText('×13');
  await expect(page.getByTestId('storage-personal')).toContainText('×19');
  await capture(page, 'depot', info);
  await page.getByTestId('storage-tab-warehouse').click();
  await expect(page.getByTestId('warehouse-slots')).toContainText('0 / 20');
  expect(errors).toEqual([]);
});
test('new storage controls have all five languages and no horizontal overflow', async ({
  page,
}) => {
  await enter(page);
  await storage(page);
  const panel = page.locator('.storage-panel');
  await open(page, '시스템', '설정');
  const language = page.locator('.settings-body select').first();
  const names = {
    ko: ['개인 도시 창고', '거래보관소', 'NPC 배송'],
    en: ['Personal city warehouse', 'Transaction depot', 'NPC logistics'],
    ja: ['個人都市倉庫', '取引保管所', 'NPC配送'],
    'zh-CN': ['个人城市仓库', '交易保管所', 'NPC物流'],
    vi: ['Kho cá nhân trong thành phố', 'Kho nhận giao dịch', 'Vận chuyển NPC'],
  };
  for (const [code, words] of Object.entries(names)) {
    await language.selectOption(code);
    for (const [n, key] of ['warehouse', 'depot', 'logistics'].entries())
      await expect(page.getByTestId('storage-tab-' + key)).toHaveText(words[n]);
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
