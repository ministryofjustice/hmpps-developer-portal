import { expect, test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import MonitorPage from '../pages/monitor'
import redis from '../mockApis/redis'

test.describe('Visit health monitor page', () => {
  test.beforeEach(async () => {
    await redis.seed()
  })

  test('should load the home page and go to health monitor page', async ({ page }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.monitorLink()

    await Page.verifyOnPage(MonitorPage, page)
  })
})

test.describe('Monitor tiles', () => {
  test.beforeEach(async () => {
    await redis.seed()
  })

  test('should render tiles with version and UP status when data loads', async ({ page }) => {
    await page.clock.install()
    await page.goto('/monitor')
    const monitorPage = await Page.verifyOnPage(MonitorPage, page)

    const tile = monitorPage.tile('hmpps-developer-portal', 'dev')

    await expect(tile).toHaveClass(/statusTileUp/)
    await expect(tile.locator('.statusTileStatus')).toHaveText('UP')
    await expect(tile.locator('.statusTileBuild')).toHaveText(/\d{4}-\d{2}-\d{2}\.1\.abcdef0/)
  })

  test('should update tile to DOWN when next poll fetches new health', async ({ page }) => {
    await page.clock.install()
    await page.goto('/monitor')
    const monitorPage = await Page.verifyOnPage(MonitorPage, page)
    const tile = monitorPage.tile('hmpps-developer-portal', 'dev')
    await expect(tile).toHaveClass(/statusTileUp/)

    await redis.setHealth('hmpps-developer-portal', 'dev', 'DOWN')
    await page.clock.fastForward('00:31')

    await expect(tile).toHaveClass(/statusTileDown/)
    await expect(tile.locator('.statusTileStatus')).toHaveText('DOWN')
  })

  test('should mark tiles stale when data older than ten minutes', async ({ page }) => {
    await page.clock.install()
    await page.goto('/monitor')
    const monitorPage = await Page.verifyOnPage(MonitorPage, page)
    const tile = monitorPage.tile('hmpps-developer-portal', 'dev')
    await expect(tile).toHaveClass(/statusTileUp/)

    await page.clock.fastForward('11:00')

    await expect(tile).toHaveClass(/statusTileStale/)
  })

  test('should hide rows when environment checkbox unticked', async ({ page }) => {
    await page.goto('/monitor')
    const monitorPage = await Page.verifyOnPage(MonitorPage, page)
    const devTile = monitorPage.tile('hmpps-developer-portal', 'dev')
    const prodTile = monitorPage.tile('hmpps-developer-portal', 'prod')
    await expect(devTile).toBeVisible()
    await expect(prodTile).toBeVisible()

    await monitorPage.toggleEnvironment('dev')

    await expect(devTile).toBeHidden()
    await expect(prodTile).toBeVisible()
  })
})
