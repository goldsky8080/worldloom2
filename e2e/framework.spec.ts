import { WORLD_CONFIG } from '../src/core/world/worldConfig';
import { test, expect, type Page } from '@playwright/test';
async function enter(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: '월드 접속', exact: true }).click();
  await expect(page.getByRole('heading', { name: '푸른 변경 지대', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.world-loading')).toHaveCount(0);
}
async function open(page: Page, category: string, panel: string) {
  const categoryButton = page.getByRole('button', { name: category, exact: true });
  if ((await categoryButton.getAttribute('aria-expanded')) !== 'true') await categoryButton.click();
  await page
    .getByRole('navigation', { name: category, exact: true })
    .getByRole('button', { name: panel, exact: true })
    .click();
}
async function selectVein(page: Page) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Canvas missing');
  const c = WORLD_CONFIG.camera;
  await page.mouse.click(
    box.x + box.width / 2 + (1200 - c.defaultX) * c.defaultZoom,
    box.y + box.height / 2 + (600 - c.defaultY) * c.defaultZoom,
  );
  const detail = page.getByRole('dialog', { name: '선택한 객체', exact: true });
  await expect(detail).toContainText('구리 광맥');
  return detail;
}
async function arrive(page: Page) {
  const detail = await selectVein(page);
  await expect(detail.getByRole('button', { name: '채광 시작', exact: true })).toBeDisabled();
  await detail.getByRole('button', { name: '광맥으로 이동', exact: true }).click();
  await expect(detail.getByText('도착까지', { exact: false })).toBeVisible();
  await expect(detail.getByRole('button', { name: '채광 시작', exact: true })).toBeEnabled();
  return detail;
}
test('login, Pixi world, registry panels and placeholder art', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: '로그인', exact: true })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/login-' + info.project.name + '.png' });
  await enter(page);
  await page.screenshot({ path: 'docs/screenshots/world-' + info.project.name + '.png' });
  await open(page, '월드', '캐릭터');
  await expect(page.getByRole('dialog', { name: '캐릭터', exact: true })).toBeVisible();
  await expect(page.getByText('보유 캐릭터 · 7')).toBeVisible();
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await open(page, '경제', '인벤토리');
  await expect(page.getByRole('dialog', { name: '인벤토리', exact: true })).toBeVisible();
  await expect(page.getByText('구리 광석', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/inventory-' + info.project.name + '.png' });
  expect(errors).toEqual([]);
});
test('first playable loop: select, distance, travel, mine and authoritative reward', async ({
  page,
}, info) => {
  await enter(page);
  const detail = await selectVein(page);
  await expect(detail).toContainText('현재 거리');
  await expect(detail).toContainText('예상 이동시간');
  await expect(detail).toContainText('채광 가능 거리');
  await expect(detail.getByRole('button', { name: '채광 시작', exact: true })).toBeDisabled();
  const before = await detail.getByTestId('world-distance').innerText();
  await detail.getByRole('button', { name: '광맥으로 이동', exact: true }).click();
  await expect(detail.getByText('도착까지', { exact: false })).toBeVisible();
  await expect(detail.getByRole('button', { name: '채광 시작', exact: true })).toBeDisabled();
  await expect(detail.getByTestId('world-distance')).not.toHaveText(before);
  await page.screenshot({ path: 'docs/screenshots/v02-travel-' + info.project.name + '.png' });
  await expect(detail.getByRole('button', { name: '채광 시작', exact: true })).toBeEnabled();
  await expect(detail.getByTestId('world-distance')).toHaveText('0 단위');
  await detail.getByRole('button', { name: '채광 시작', exact: true }).click();
  await expect(detail.getByRole('progressbar')).toBeVisible();
  await expect(detail.getByRole('progressbar')).toBeInViewport();
  await expect(detail.getByRole('button', { name: '광맥으로 이동', exact: true })).toBeDisabled();
  await page.screenshot({ path: 'docs/screenshots/v02-mining-' + info.project.name + '.png' });
  await expect(detail.getByText('구리 광석 +3', { exact: true })).toBeVisible();
  await expect(page.locator('.toast-stack')).toContainText('채광 완료');
  await page.screenshot({ path: 'docs/screenshots/v02-reward-' + info.project.name + '.png' });
  await detail.getByRole('button', { name: '닫기', exact: true }).click();
  await open(page, '경제', '인벤토리');
  await expect(page.getByText('수량: 15', { exact: true })).toBeVisible();
});
test('language switch, mail rewards and chat', async ({ page }) => {
  await enter(page);
  await open(page, '소셜', '우편');
  await page.getByRole('button', { name: '전체 수령', exact: true }).click();
  await expect(page.locator('.hud .resource-badge')).toContainText('1,325');
  await page
    .getByRole('dialog', { name: '우편', exact: true })
    .getByRole('button', { name: '닫기', exact: true })
    .click();
  if (!(await page.getByRole('textbox', { name: '메시지 입력…' }).isVisible()))
    await page.getByRole('button', { name: '채팅', exact: true }).click();
  await page.getByRole('textbox', { name: '메시지 입력…' }).fill('Hello frontier');
  await page.getByRole('button', { name: '보내기', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('Hello frontier');
  await open(page, '시스템', '설정');
  await page.getByRole('combobox', { name: '언어' }).selectOption('en');
  await expect(page.getByRole('tab', { name: 'General', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('vi');
  await expect(page.getByRole('tab', { name: 'Chung', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Cài đặt', exact: true })).toBeVisible();
});
test('disconnect replay, sequence gap and session expiration', async ({ page }) => {
  await enter(page);
  await page.getByRole('button', { name: 'F2', exact: true }).click();
  await page.getByRole('button', { name: '3초 연결 끊기', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.getByRole('button', { name: '이벤트 누락 시험', exact: true }).click();
  await expect(page.getByText('월드 동기화 완료', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.getByRole('button', { name: '세션 만료 시험', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('세션 만료');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
});
test('signup and mock email verification', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('이메일', { exact: true }).fill('new@living.world');
  await page.getByLabel('비밀번호', { exact: true }).fill('mockpass123');
  await page.getByLabel('비밀번호 확인', { exact: true }).fill('mockpass123');
  await page.getByLabel('닉네임', { exact: true }).fill('Tester');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '회원가입', exact: true }).click();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await open(page, '시스템', '계정');
  await expect(page.getByText('이메일 미인증', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '이메일 인증 (Mock)', exact: true }).click();
  await expect(page.getByText('Mock 이메일 인증 완료', { exact: true })).toBeVisible();
});

test('map selection, travel, keyboard camera and window restoration', async ({ page }) => {
  await enter(page);
  const canvas = page.locator('canvas'),
    detail = await selectVein(page);
  await detail.getByRole('button', { name: '광맥으로 이동', exact: true }).click();
  await expect(page.getByText('이동 완료', { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: '최소화', exact: true }).click();
  await page.getByRole('button', { name: '복원 선택한 객체', exact: true }).click();
  await expect(detail).toBeVisible();
  await detail.getByRole('button', { name: '닫기', exact: true }).click();
  await canvas.focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('+');
  await page.keyboard.press('Enter');
  await expect(detail).toBeVisible();
});

test('mining state survives panel close, reopen and connection recovery', async ({ page }) => {
  await enter(page);
  const detail = await arrive(page);
  await detail.getByRole('button', { name: '채광 상세 보기', exact: true }).click();
  let mining = page.getByRole('dialog', { name: '채광', exact: true });
  await mining.getByRole('button', { name: '채광 시작', exact: true }).click();
  await expect(mining.getByRole('progressbar')).toBeVisible();
  await mining.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(detail.getByRole('progressbar')).toBeVisible();
  await detail.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('button', { name: 'F2', exact: true }).click();
  await page.getByRole('button', { name: '3초 연결 끊기', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'F2', exact: true }).click();
  await open(page, '생활', '채광');
  mining = page.getByRole('dialog', { name: '채광', exact: true });
  await expect(mining.getByText('구리 광석 +3', { exact: true })).toBeVisible();
  await expect(mining.getByRole('button', { name: '채광 시작', exact: true })).toBeEnabled();
});
test('world interaction UI preserves all five locales', async ({ page }) => {
  await enter(page);
  const detail = await selectVein(page);
  await detail.getByRole('button', { name: '닫기', exact: true }).click();
  await open(page, '생활', '채광');
  await open(page, '시스템', '설정');
  const values = [
    ['en', 'Mining', 'Current distance'],
    ['ja', '採掘', '現在の距離'],
    ['zh-CN', '采矿', '当前距离'],
    ['vi', 'Khai khoáng', 'Khoảng cách hiện tại'],
    ['ko', '채광', '현재 거리'],
  ];
  for (const [locale, title, distance] of values) {
    await page.locator('select').first().selectOption(locale);
    await expect(page.getByRole('dialog', { name: title, exact: true })).toContainText(distance);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
  }
});
