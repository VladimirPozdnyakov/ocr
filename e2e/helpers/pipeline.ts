import { expect, type Page } from '@playwright/test'
import {
  openMenuItem,
  readTextBlocksCount,
  waitForLayerHasContent,
} from './app'
import { selectors } from './selectors'

export async function runDetect(page: Page, timeout = 45_000) {
  await page.getByTestId(selectors.toolbar.detect).click()
  await waitForLayerHasContent(page, 'mask', true, timeout)
  await waitForOperationFinish(page, timeout)
}

export async function runOcr(page: Page, timeout = 45_000) {
  await page.getByTestId(selectors.toolbar.ocr).click()
  await expect
    .poll(async () => readTextBlocksCount(page), { timeout })
    .toBeGreaterThan(0)
  const firstCard = page.getByTestId(selectors.panels.textBlockCard(0))
  await expect(firstCard).toBeVisible({ timeout })
  await firstCard.click()
  await expect(page.getByTestId(selectors.panels.textBlockOcr(0))).toBeVisible({
    timeout,
  })
  await waitForOperationFinish(page, timeout)
}

export async function runRender(page: Page, timeout = 45_000) {
  await page.getByTestId(selectors.toolbar.render).click()
  await waitForLayerHasContent(page, 'rendered', true, timeout)
  await waitForOperationFinish(page, timeout)
}

export async function prepareDetectAndOcr(page: Page) {
  await runDetect(page)
  await runOcr(page)
}

export async function startProcessCurrent(page: Page) {
  await openMenuItem(
    page,
    selectors.menu.processTrigger,
    selectors.menu.processCurrent,
  )
}

export async function startProcessAll(page: Page) {
  await openMenuItem(
    page,
    selectors.menu.processTrigger,
    selectors.menu.processAll,
  )
}

export async function waitForOperationStart(
  page: Page,
  operationType: 'process-current' | 'process-all',
  timeout = 45_000,
) {
  const card = page.getByTestId(selectors.operations.card)
  await expect(card).toBeVisible({ timeout })
  await expect(card).toHaveAttribute('data-operation-type', operationType, {
    timeout,
  })
}

export async function waitForOperationFinish(page: Page, timeout = 90_000) {
  await expect(page.getByTestId(selectors.operations.card)).toBeHidden({
    timeout,
  })
}

export async function waitForOperationProgressAdvance(
  page: Page,
  timeout = 45_000,
) {
  const card = page.getByTestId(selectors.operations.card)
  const initialCurrent = Number(
    (await card.getAttribute('data-current')) ?? '0',
  )
  await expect
    .poll(
      async () => {
        const raw = await card.getAttribute('data-current')
        const value = Number(raw ?? '0')
        return Number.isFinite(value) ? value : 0
      },
      { timeout },
    )
    .toBeGreaterThan(initialCurrent)
}
