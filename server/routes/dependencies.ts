import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { ServiceCatalogueService, Services } from '../services'
import { getDependencyName, getDependencyType } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get(['/', '/:dependencyType/:dependencyName'], async (req, res) => {
    const dependencyType = getDependencyType(req)
    const dependencyName = getDependencyName(req)
    const dropDownItems = await getDropDownOptions(serviceCatalogueService, `${dependencyType}::${dependencyName}`)

    return res.render('pages/dependencies', { dropDownItems, dependencyType, dependencyName })
  })

  get('/data/:dependencyType/:dependencyName', async (req, res) => {
    const dependencyType = getDependencyType(req)
    const dependencyName = getDependencyName(req)
    const components = await serviceCatalogueService.getComponents()

    const displayComponents = components
      .filter(component => {
        // @ts-expect-error Suppress any declaration
        if (component.attributes?.versions && component.attributes?.versions[dependencyType]) {
          // @ts-expect-error Suppress any declaration
          return component.attributes.versions[dependencyType][dependencyName]
        }

        return false
      })
      .map(component => {
        // @ts-expect-error Suppress any declaration
        const dependencyVersion = component.attributes.versions[dependencyType][dependencyName]

        return {
          id: component.id,
          componentName: component.attributes.name,
          dependencyVersion,
        }
      })

    res.send(displayComponents)
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
