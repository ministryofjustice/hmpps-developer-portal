import { type RequestHandler, type Request, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { ServiceCatalogueService, Services } from '../services'
import { getDependencyName, getDependencyType } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const dropDownItems = await getDropDownOptions(serviceCatalogueService)

    return res.render('pages/dependencies', { dropDownItems })
  })

  post('/', async (req, res) => {
    const { dependencyType, dependencyName } = getDependencyData(req)
    const dropDownItems = await getDropDownOptions(serviceCatalogueService, `${dependencyType}::${dependencyName}`)

    return res.render('pages/dependencies', { dependencyType, dependencyName, dropDownItems })
  })

  get('/data/:dependencyType/:dependencyName', async (req, res) => {
    const dependencyType = getDependencyType(req)
    const dependencyName = getDependencyName(req)
    const components = await serviceCatalogueService.getComponents()

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

    return res.send(displayComponents)
  })

  return router
}

export const getDependencyData = (req: Request) => {
  const { dependencyData } = req.body

  const parts = dependencyData.replace(/[^-a-z0-9:_]/g, '').split('::')

  return {
    dependencyType: parts[0],
    dependencyName: parts[1],
  }
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
