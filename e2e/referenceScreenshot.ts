import { test, type Page } from '@playwright/test';
// Regression runs preserve checked-in evidence unless explicitly asked to refresh it.
export async function referenceScreenshot(
  page: Page,
  options: Parameters<Page['screenshot']>[0] = {},
) {
  const { path, ...rest } = options;
  return page.screenshot({
    ...rest,
    path:
      process.env.PLAYWRIGHT_UPDATE_REFERENCE_SCREENSHOTS === '1'
        ? path
        : test.info().outputPath(path?.split(/[\\/]/).at(-1) ?? 'reference.png'),
  });
}
