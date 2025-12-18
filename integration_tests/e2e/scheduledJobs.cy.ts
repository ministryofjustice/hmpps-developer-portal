import HomePage from '../pages/home'
import Page from '../pages/page'
import ScheduledJobPage from '../pages/scheduledJob'
import ScheduledJobsPage from '../pages/scheduledJobs'

context('Visit Scheduled Jobs Page', () => {
  it('should load the home page, go to Scheduled Jobs page, click the first job link and visit that page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.scheduledJobsLink()

    const scheduledJobsPage = Page.verifyOnPage(ScheduledJobsPage)
    scheduledJobsPage.scheduledJobLink().then(scheduledJobName => {
      Page.verifyOnPage(ScheduledJobPage, scheduledJobName)
    })
  })
})
