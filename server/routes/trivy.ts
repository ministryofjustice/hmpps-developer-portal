import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { TrivyDisplayEntry, TrivyResult, TrivyScanResults, TrivyVulnerability } from '../@types'

export default function routes({ serviceCatalogueService, componentNameService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const components = await componentNameService.getAllDeployedComponents()
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: '',
      productName: '',
      serviceAreaName: '',
      customComponentName: '',
      useFormattedName: true,
    })

    return res.render('pages/trivy', {
      title: 'Trivy',
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  post('/data', async (req, res) => {
    const componentsToInclude = req.body.componentNames
    console.log(`in post code`)
    const components = (await serviceCatalogueService.getComponents())
      .filter(component => componentsToInclude.includes(component.attributes.name))
      .map(component => {
        const hasResults = component.attributes.trivy_scan_summary !== null

        if (hasResults) {
          const results: TrivyResult[] = (component.attributes.trivy_scan_summary as TrivyScanResults).Results ?? []

          return results.reduce((displayEntries: TrivyDisplayEntry[], result: TrivyResult) => {
            displayEntries.push(
              result.Vulnerabilities?.map((vulnerability: TrivyVulnerability) => {
                const referenceUrls = vulnerability.References.map(url => `<a href="${url}">${url}</a>`)
                const references = `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Links</span></summary><div class="govuk-details__text">${referenceUrls.join('<br>')}</div></details>`

                return {
                  name: component.attributes.name,
                  title: vulnerability.Title,
                  lastScan: component.attributes.trivy_last_completed_scan_date,
                  vulnerability: vulnerability.VulnerabilityID,
                  primaryUrl: vulnerability.PrimaryURL,
                  severity: vulnerability.Severity,
                  references,
                }
              }) as unknown as TrivyDisplayEntry,
            )

            return displayEntries
          }, [])
        }

        return []
      })
      .flat(Infinity)
      .filter(n => n)
      .map(n => JSON.stringify(n))

    const uniqueRows = new Set(components)

    res.send(Array.from(uniqueRows).map(n => JSON.parse(n)))
  })

  get('/teams/:teamName', async (req, res) => {
    const { teamName } = req.params
    const components = await componentNameService.getAllDeployedComponentsForTeam(teamName)
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName,
      productName: '',
      serviceAreaName: '',
      customComponentName: '',
      useFormattedName: true,
    })

    return res.render('pages/trivy', {
      title: `Trivy for ${teamName}`,
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  get('/service-areas/:serviceAreaName', async (req, res) => {
    const { serviceAreaName } = req.params
    const components = await componentNameService.getAllDeployedComponentsForServiceArea(serviceAreaName)
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: '',
      productName: '',
      serviceAreaName,
      customComponentName: '',
      useFormattedName: true,
    })

    return res.render('pages/trivy', {
      title: `Trivy for ${serviceAreaName}`,
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  get('/products/:productName', async (req, res) => {
    const { productName } = req.params
    const components = await componentNameService.getAllDeployedComponentsForProduct(productName)
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: '',
      productName,
      serviceAreaName: '',
      customComponentName: '',
      useFormattedName: true,
    })

    return res.render('pages/trivy', {
      title: `Trivy for ${productName}`,
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  get('/custom-components/:customComponentName', async (req, res) => {
    const { customComponentName } = req.params
    const components = await componentNameService.getAllDeployedComponentsForCustomComponents(customComponentName)
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: '',
      productName: '',
      serviceAreaName: '',
      customComponentName,
      useFormattedName: true,
    })

    return res.render('pages/trivy', {
      title: `Trivy for ${customComponentName}`,
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  return router
}
