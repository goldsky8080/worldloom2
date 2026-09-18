import { test, expect, type Page, type TestInfo } from '@playwright/test';
test.use({
  launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: ['--enable-unsafe-swiftshader'],
  },
});
async function setup(page: Page) {
  await page.clock.install();
  await page.goto('/fief');
  await expect(page.getByTestId('fief-context')).toBeVisible();
  await page.getByTestId('fief-dev-toggle').click();
  await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  await page.getByTestId('fief-dev-reset').click();
  await page
    .getByRole('combobox', { name: '개발용 시간 조작', exact: true })
    .selectOption('design');
  await page.getByTestId('fief-dev-toggle').click();
}
async function dev(page: Page, work: () => Promise<void>) {
  await page.getByTestId('fief-dev-toggle').click();
  await work();
  await page.getByTestId('fief-dev-toggle').click();
}
const castle = (page: Page) => page.getByRole('button', { name: '성', exact: true }).click();
const manor = (page: Page) => page.getByRole('button', { name: '장원', exact: true }).click();
const read = (page: Page, id: string) =>
  page
    .getByTestId('fief-' + id)
    .innerText()
    .then(parseFloat);
async function assign(page: Page, count: number) {
  await page.getByTestId('fief-standing-count').fill(String(count));
  await page.getByTestId('fief-standing-apply').click();
}
async function capture(page: Page, name: string, info: TestInfo) {
  await page.getByTestId('fief-page').evaluate((el) => (el.scrollTop = 0));
  await page.screenshot({
    animations: 'disabled',
    path: 'docs/screenshots/fief-v03-' + name + '-' + info.project.name + '.png',
  });
}
test('standing force automatically lowers saturation and reserves defense troops', async ({
  page,
}, info) => {
  await setup(page);
  await capture(page, 'overview', info);
  await castle(page);
  const saturation = await read(page, 'hud-saturation');
  await assign(page, 20);
  await expect(page.getByTestId('fief-standingAssigned')).toHaveText('20');
  await expect(page.getByTestId('fief-available')).toHaveText('20');
  await expect(page.getByTestId('fief-standing-marker')).toBeVisible();
  await page.clock.runFor(10250);
  expect(await read(page, 'hud-saturation')).toBeLessThan(saturation);
  await page.getByTestId('fief-standing-count').fill('41');
  await expect(page.getByTestId('fief-standing-apply')).toBeDisabled();
  await page.getByTestId('fief-standing-count').fill('20');
  await capture(page, 'standing', info);
});
test('standing casualties reduce assignment and wounded recover while dead remain lost', async ({
  page,
}) => {
  await setup(page);
  await dev(page, async () => {
    for (let i = 0; i < 4; i++) await page.getByTestId('fief-dev-saturation').click();
  });
  await castle(page);
  await assign(page, 20);
  await page.clock.runFor(35250);
  expect(await read(page, 'wounded')).toBeGreaterThan(0);
  const dead = await read(page, 'dead');
  expect(dead).toBeGreaterThan(0);
  expect(await read(page, 'standingAssigned')).toBeLessThan(20);
  await assign(page, 0);
  await expect(page.getByTestId('fief-standing-marker')).toHaveCount(0);
  await page.clock.runFor(31250);
  await expect(page.getByTestId('fief-wounded')).toHaveText('0');
  expect(await read(page, 'dead')).toBe(dead);
  expect(await read(page, 'healthy')).toBe(40 - dead);
});
test('recruitment charges once and waits for job progress before healthy soldiers join', async ({
  page,
}) => {
  await setup(page);
  await castle(page);
  await page.getByTestId('fief-recruit-count').fill('20');
  await page.getByTestId('fief-recruit').click();
  await expect(page.getByTestId('fief-recruitment-status')).toHaveAttribute(
    'data-state',
    'RECRUITING',
  );
  await expect(page.getByTestId('fief-healthy')).toHaveText('40');
  await expect(page.getByTestId('fief-recruit')).toBeDisabled();
  await expect(page.getByTestId('fief-treasury')).toHaveAttribute('data-value', '9500');
  await expect(page.getByRole('progressbar', { name: '모병', exact: true })).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.getByTestId('fief-healthy')).toHaveText('40');
  await page.clock.runFor(5500);
  await expect(page.getByTestId('fief-healthy')).toHaveText('60');
  await expect(page.getByTestId('fief-recruitment-status')).toHaveAttribute(
    'data-state',
    'SUCCEEDED',
  );
  await page.clock.runFor(1000);
  await expect(page.getByTestId('fief-healthy')).toHaveText('60');
  await page.getByTestId('fief-recruit-count').fill('21');
  await expect(page.getByTestId('fief-recruit')).toBeDisabled();
});
test('dungeon break spikes saturation and dispatches a wave; emergency has its own costs and casualties', async ({
  page,
}, info) => {
  await setup(page);
  await dev(page, async () => {
    await page.getByTestId('fief-dev-break').click();
  });
  expect(await read(page, 'hud-saturation')).toBe(53);
  await expect(page.getByTestId('fief-wave-monster')).toHaveCount(4);
  await castle(page);
  await page.getByTestId('fief-emergency-count').fill('20');
  await page.getByTestId('fief-emergency-start').click();
  await expect(page.getByTestId('fief-available')).toHaveText('20');
  await expect(page.getByTestId('fief-treasury')).toHaveAttribute('data-value', '9800');
  await expect(page.getByTestId('fief-emergency-start')).toBeDisabled();
  await page.clock.runFor(3250);
  await expect(page.getByTestId('fief-emergency-marker')).toBeVisible();
  await capture(page, 'emergency', info);
  await page.clock.runFor(3500);
  await expect(page.getByTestId('fief-emergency-status')).toHaveAttribute(
    'data-state',
    'SUCCEEDED',
  );
  expect(await read(page, 'hud-saturation')).toBeLessThan(14);
  await expect(page.getByTestId('fief-healthy')).toHaveText('36');
  await expect(page.getByTestId('fief-wounded')).toHaveText('3');
  await expect(page.getByTestId('fief-dead')).toHaveText('1');
  expect(await read(page, 'hud-aether')).toBe(100);
  await page.clock.runFor(1500);
  await expect(page.getByTestId('fief-wave')).toHaveCount(0);
  expect(await read(page, 'sentiment-value')).toBe(65);
});
test('prolonged maximum saturation continuously damages security, prosperity and sentiment in order', async ({
  page,
}) => {
  await setup(page);
  await dev(page, async () => {
    for (let i = 0; i < 5; i++) await page.getByTestId('fief-dev-saturation').click();
  });
  await expect(page.getByTestId('fief-wave')).toHaveCount(0);
  const before = [
    await read(page, 'security-value'),
    await read(page, 'prosperity-value'),
    await read(page, 'sentiment-value'),
  ];
  await page.clock.runFor(10000);
  const first = [
    await read(page, 'security-value'),
    await read(page, 'prosperity-value'),
    await read(page, 'sentiment-value'),
  ];
  expect(before[0] - first[0]).toBeGreaterThan(before[1] - first[1]);
  expect(before[1] - first[1]).toBeGreaterThan(before[2] - first[2]);
  await page.clock.runFor(10000);
  expect(await read(page, 'security-value')).toBeLessThan(first[0]);
  expect(await read(page, 'sentiment-value')).toBeLessThan(first[2]);
});
test('safe conditions first restore security then delayed prosperity and slower sentiment', async ({
  page,
}) => {
  await setup(page);
  await dev(page, async () => {
    await page.getByTestId('fief-dev-states').click();
    await page.getByTestId('fief-dev-saturation-down').click();
    await page.getByTestId('fief-dev-instant-raid').click();
  });
  await page.clock.runFor(10000);
  expect(await read(page, 'security-value')).toBeGreaterThan(30);
  expect(await read(page, 'prosperity-value')).toBe(30);
  expect(await read(page, 'sentiment-value')).toBe(30);
  await dev(page, async () => {
    for (let i = 0; i < 3; i++) await page.getByTestId('fief-dev-advance').click();
  });
  await page.clock.runFor(25000);
  expect(await read(page, 'security-value')).toBeGreaterThanOrEqual(80);
  expect(await read(page, 'prosperity-value')).toBeGreaterThan(30);
  expect(await read(page, 'sentiment-value')).toBe(30);
  await page.clock.runFor(25000);
  expect(await read(page, 'sentiment-value')).toBeGreaterThan(30);
  await page.getByRole('button', { name: '도시', exact: true }).click();
  await expect(page.getByTestId('fief-recovery-sentiment')).toContainText('점진 회복');
});
test('manor tax cooldown, recurring revenue, policy slots and automatic funding suspension work together', async ({
  page,
}, info) => {
  await setup(page);
  await manor(page);
  await page.getByTestId('fief-tax-low').click();
  await expect(page.getByTestId('fief-tax-status')).toHaveAttribute('data-policy', 'LOW');
  await expect(page.getByTestId('fief-tax-high')).toBeDisabled();
  await expect(page.getByTestId('fief-revenue-estimate')).toHaveText('+126 G');
  await page.getByTestId('fief-policy-resident_relief').click();
  await expect(page.getByTestId('fief-policy-slots')).toHaveText('1 / 1');
  await expect(page.getByTestId('fief-policy-security_support')).toBeDisabled();
  await expect(page.getByTestId('fief-treasury')).toHaveAttribute('data-value', '10000');
  expect(await read(page, 'sentiment-value')).toBe(70);
  await capture(page, 'manor', info);
  await page.clock.runFor(30250);
  await expect(page.getByTestId('fief-tax-high')).toBeEnabled();
  await expect(page.getByTestId('fief-economy-last')).toContainText('−140');
  expect(Number(await page.getByTestId('fief-treasury').getAttribute('data-value'))).toBeLessThan(
    10000,
  );
  await dev(page, async () => {
    await page.getByTestId('fief-dev-empty-treasury').click();
  });
  await page.clock.runFor(30250);
  await expect(page.getByTestId('fief-policy-slots')).toHaveText('0 / 1');
  await expect(page.getByTestId('fief-context')).toContainText('운영 자금 부족');
  await dev(page, async () => {
    await page.getByTestId('fief-dev-treasury').click();
    await page.getByTestId('fief-dev-manor-level').selectOption('3');
  });
  await page.getByTestId('fief-policy-security_support').click();
  await page.getByTestId('fief-policy-commerce_support').click();
  await expect(page.getByTestId('fief-policy-slots')).toHaveText('2 / 2');
  await expect(page.getByTestId('fief-policy-recruitment_support')).toBeDisabled();
  await dev(page, async () => {
    await page.getByTestId('fief-dev-manor-level').selectOption('5');
  });
  await page.getByTestId('fief-policy-reconstruction').click();
  await expect(page.getByTestId('fief-policy-slots')).toHaveText('3 / 3');
});
test('all five languages localize new military and administration controls without mobile overflow', async ({
  page,
}) => {
  await setup(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const words = {
    ko: ['상시 토벌대', '낮은 세율'],
    en: ['Standing suppression force', 'Low tax'],
    ja: ['常設討伐隊', '低税率'],
    'zh-CN': ['常驻讨伐队', '低税率'],
    vi: ['Đội trấn áp thường trực', 'Thuế thấp'],
  };
  for (const [language, [standing, tax]] of Object.entries(words)) {
    await page.locator('.fief-header select').selectOption(language);
    const castleName = { ko: '성', en: 'Castle', ja: '城', 'zh-CN': '城堡', vi: 'Thành' }[
      language
    ]!;
    const manorName = { ko: '장원', en: 'Manor', ja: '荘園', 'zh-CN': '庄园', vi: 'Trang viên' }[
      language
    ]!;
    await page.getByRole('button', { name: castleName, exact: true }).click();
    await expect(page.getByRole('heading', { name: standing, exact: true })).toBeVisible();
    await page.getByRole('button', { name: manorName, exact: true }).click();
    await expect(page.getByTestId('fief-tax-low')).toHaveText(tax);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByTestId('fief-dev-panel')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
