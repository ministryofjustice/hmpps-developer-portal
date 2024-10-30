import { type RequestHandler, Router } from 'express'
import dayjs from 'dayjs'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { veracodeFilters } from '../utils/utils'

export default function routes({ serviceCatalogueService, componentNameService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/veracode')
  })

  get('/data', async (req, res) => {
    const resultFilters = getResultFilters(req.query.results as string)
    const exemptionFilters = getExemptionFilters(req.query.exemption as string)
    const allComponents = await serviceCatalogueService.getComponents(exemptionFilters)
    const passed = resultFilters.includes('passed')
    const failed = resultFilters.includes('failed')
    const unknown = resultFilters.includes('unknown')

    const rows = allComponents
      .filter(component => veracodeFilters(passed, failed, unknown, component.attributes.veracode_policy_rules_status))
      .map(component => {
        const hasVeracode = !!component.attributes.veracode_results_summary
        const severityLevels = {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          VERY_HIGH: 0,
        }

        component.attributes.veracode_results_summary?.severity?.forEach(severity => {
          severity.category.forEach(category => {
            // @ts-expect-error Suppress any declaration
            severityLevels[category.severity] += category.count
          })
        })

        let result = 'Failed'

        if (!hasVeracode) {
          result = 'N/A'
        } else if (component.attributes.veracode_policy_rules_status === 'Pass') {
          result = 'Passed'
        }

        return {
          name: component.attributes.name,
          hasVeracode,
          result,
          report: hasVeracode ? component.attributes.veracode_results_url : 'N/A',
          date: hasVeracode
            ? dayjs(component.attributes.veracode_last_completed_scan_date).format('YYYY-MM-DD HH:mm')
            : 'N/A',
          codeScore: hasVeracode ? component.attributes.veracode_results_summary['static-analysis'].score : 0,
          severityLevels,
        }
      })

    res.send(rows)
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

    return res.render('pages/veracode', {
      title: `Veracode for ${teamName}`,
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

    return res.render('pages/veracode', {
      title: `Veracode for ${serviceAreaName}`,
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

    return res.render('pages/veracode', {
      title: `Veracode for ${productName}`,
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

    return res.render('pages/veracode', {
      title: `Veracode for ${customComponentName}`,
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  return router
}

const getResultFilters = (resultFilters: string): string[] => {
  if (!resultFilters) {
    return []
  }

  const resultFiltersToCheck = resultFilters.split(',')

  return resultFiltersToCheck.filter(resultFilter => ['passed', 'failed', 'unknown'].includes(resultFilter))
}

const getExemptionFilters = (exemptionFilters: string): string[] => {
  if (!exemptionFilters) {
    return []
  }

  const exemptionFiltersToCheck = exemptionFilters.split(',')

  return exemptionFiltersToCheck.filter(exemptionFilter => ['true', 'false'].includes(exemptionFilter))
}
