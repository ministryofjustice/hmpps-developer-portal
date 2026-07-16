import { expect, test } from '@playwright/test'
import HomePage from '../pages/home'
import ComponentPage from '../pages/component'
import ComponentsPage from '../pages/components'
import Page from '../pages/page'
import redis from '../mockApis/redis'

test.describe('visit the accredited programmes and delius component page', () => {
  test.beforeEach(async () => {
    await redis.seed()
  })

  test('should load the home page, go to the components page, click on the first link(accredited programmes and delius), and go to that page', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.componentsLink()

    const componentsPage = await Page.verifyOnPage(ComponentsPage, page)
    await componentsPage.componentLink()

    await Page.verifyOnPage(ComponentPage, page, 'accredited-programmes-and-delius')
  })
})

test.describe('Components table', () => {
  const componentNames = ['accredited-programmes-and-delius', 'hmpps-component-dependencies', 'hmpps-developer-portal']

  test.beforeEach(async () => {
    await redis.seed()
  })

  test('should render all components when table loads', async ({ page }) => {
    await page.goto('/components')
    const componentsPage = await Page.verifyOnPage(ComponentsPage, page)

    const links = componentsPage.componentLinks()

    await expect(links).toHaveText(componentNames)
    await Promise.all(
      componentNames.map(async (name, index) => {
        await expect(links.nth(index)).toHaveAttribute('href', `/components/${name}`)
        await expect(componentsPage.githubRepoLinks().nth(index)).toHaveAttribute(
          'href',
          `https://github.com/ministryofjustice/${name}`,
        )
      }),
    )
  })

  test('should filter rows when typing in name column search', async ({ page }) => {
    await page.goto('/components')
    const componentsPage = await Page.verifyOnPage(ComponentsPage, page)
    await expect(componentsPage.componentLinks()).toHaveCount(3)

    await componentsPage.searchName('developer-portal')

    await expect(componentsPage.componentLinks()).toHaveText(['hmpps-developer-portal'])

    await componentsPage.clearNameSearch()
    await expect(componentsPage.componentLinks()).toHaveCount(3)
  })

  test('should show empty message when search matches no components', async ({ page }) => {
    await page.goto('/components')
    const componentsPage = await Page.verifyOnPage(ComponentsPage, page)
    await expect(componentsPage.componentLinks()).toHaveCount(3)

    await componentsPage.searchName('zzz-no-such-component')

    await expect(componentsPage.componentLinks()).toHaveCount(0)
    await expect(componentsPage.emptyMessage()).toHaveText('No matching records found')
  })
})
