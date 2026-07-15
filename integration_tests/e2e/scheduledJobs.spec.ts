import { expect, test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import ScheduledJobPage from '../pages/scheduledJob'
import ScheduledJobsPage from '../pages/scheduledJobs'

test.describe('Visit Scheduled Jobs Page', () => {
  test('should load the home page, go to Scheduled Jobs page, click the first job link and visit that page', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.scheduledJobsLink()

    const scheduledJobsPage = await Page.verifyOnPage(ScheduledJobsPage, page)
    const scheduledJobName = await scheduledJobsPage.scheduledJobLink()
    await Page.verifyOnPage(ScheduledJobPage, page, scheduledJobName)
  })
})

test.describe('Scheduled Jobs table', () => {
  test('should render all scheduled jobs when table loads', async ({ page }) => {
    await page.goto('/scheduled-jobs')
    const scheduledJobsPage = await Page.verifyOnPage(ScheduledJobsPage, page)

    await expect(scheduledJobsPage.scheduledJobLinks()).toHaveCount(6)
    await expect(page.locator('[href="/scheduled-jobs/hmpps-health-ping"]')).toBeVisible()
    await expect(page.locator('[href="/scheduled-jobs/hmpps-veracode-discovery"]')).toBeVisible()
  })

  test('should filter rows when typing in job name column search', async ({ page }) => {
    await page.goto('/scheduled-jobs')
    const scheduledJobsPage = await Page.verifyOnPage(ScheduledJobsPage, page)
    await expect(scheduledJobsPage.scheduledJobLinks()).toHaveCount(6)

    await scheduledJobsPage.searchJobName('veracode')

    await expect(scheduledJobsPage.scheduledJobLinks()).toHaveText(['hmpps-veracode-discovery'])

    await scheduledJobsPage.clearJobNameSearch()
    await expect(scheduledJobsPage.scheduledJobLinks()).toHaveCount(6)
  })
})
