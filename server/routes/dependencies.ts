import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { ServiceCatalogueService, Services } from '../services'
import { getSanitizedValue, isValidDropDown } from '../utils/utils'

export default function routes({ serviceCatalogueService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get(['/', '/:dependencyType/:dependencyName'], async (req, res) => {
    const dependencyType = getSanitizedValue(req, 'dependencyType')
    const dependencyName = getSanitizedValue(req, 'dependencyName')
    const dropDownItems = await getDropDownOptions(serviceCatalogueService, `${dependencyType}::${dependencyName}`)
    let serviceAreaName
    let teamName
    let productName
    let customComponentName
    let filterType

    if (req.query.updateServiceArea === '' && isValidDropDown(req, 'serviceArea')) {
      serviceAreaName = req.query.serviceArea as string
      filterType = 'serviceArea'
    }
    if (req.query.updateTeam === '' && isValidDropDown(req, 'team')) {
      teamName = req.query.team as string
      filterType = 'team'
    }
    if (req.query.updateProduct === '' && isValidDropDown(req, 'product')) {
      productName = req.query.product as string
      filterType = 'product'
    }
    if (req.query.updateCustomComponentView === '' && isValidDropDown(req, 'customComponentView')) {
      customComponentName = req.query.customComponentView as string
      filterType = 'customComponent'
    }

    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName,
      productName,
      serviceAreaName,
      customComponentName,
      useFormattedName: true,
    })

    return res.render('pages/dependencies', {
      dropDownItems,
      dependencyType,
      dependencyName,
      teamList,
      productList,
      serviceAreaList,
      customComponentsList,
      teamName,
      productName,
      serviceAreaName,
      customComponentName,
      filterType,
    })
  })

  get('/data/:dependencyType/:dependencyName/:filterType/:filterValue', async (req, res) => {
    const dependencyType = getSanitizedValue(req, 'dependencyType')
    const dependencyName = getSanitizedValue(req, 'dependencyName')
    const filterType = getSanitizedValue(req, 'filterType')
    const filterValue = getSanitizedValue(req, 'filterValue')
    const components = await serviceCatalogueService.getComponentsByFilter(filterType, filterValue)

    const displayComponents = components
      .filter(component => {
        if (component.attributes?.versions && component.attributes?.versions[dependencyType]) {
          return component.attributes.versions[dependencyType][dependencyName]
        }

        return false
      })
      .map(component => {
        const dependencyVersion = component.attributes.versions[dependencyType][dependencyName]

        return {
          id: component.id,
          componentName: component.attributes.name,
          dependencyVersion,
        }
      })

    return res.json(displayComponents)
  })

  return router
}

export const getDropDownOptions = async (
  serviceCatalogueService: ServiceCatalogueService,
  currentDependency: string = '',
) => {
  type SelectList = {
    value: string
    text: string
    selected?: boolean
    attributes?: Record<string, string>
  }

  const dependencies = await serviceCatalogueService.getDependencies()

  const dropDownItems = dependencies.map((dependency): SelectList => {
    const parts = dependency.split('::')

    return {
      value: dependency,
      text: `${parts[0]}: ${parts[1]}`,
      selected: dependency === currentDependency,
      attributes: {
        'data-test': dependency,
      },
    }
  })

  dropDownItems.unshift({
    value: '',
    text: 'Please select',
  })

  return dropDownItems
}
