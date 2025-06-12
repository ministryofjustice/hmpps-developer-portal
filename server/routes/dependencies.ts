import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { ServiceCatalogueService, Services } from '../services'
import { getDependencyName, getDependencyType, getDependencyNames } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/dependency-names/:dependencyType', async (req, res) => {
    const { dependencyType } = req.params
    const dependencyNames = await getDependencyNames(serviceCatalogueService, dependencyType)
    res.json(dependencyNames)
  })

  get('/data/:dependencyType/:dependencyName', async (req, res) => {
    const dependencyType = getDependencyType(req)
    const dependencyName = getDependencyName(req).replace(/~/g, '/')

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
        const dependencyData = component.attributes?.versions?.[dependencyType]?.[dependencyName]
        const githubRepo = component.attributes?.github_repo ?? ''

        console.log('Component:', component.id, 'Dependency data:', dependencyData)

        let dependencyVersion = ''
        if (typeof dependencyData === 'string' || typeof dependencyData === 'number') {
          dependencyVersion = String(dependencyData)
        } else if (typeof dependencyData === 'object' && dependencyData !== null) {
          dependencyVersion = dependencyData.ref ?? dependencyData.version ?? ''
        }

        const location = dependencyData?.path ?? ''
        const githubUrl =
          githubRepo && location ? `https://github.com/ministryofjustice/${githubRepo}/blob/main/${location}` : ''

        return {
          id: component.id,
          componentName: component.attributes?.name ?? '',
          dependencyVersion,
          location: githubUrl,
        }
      })

    res.send(displayComponents)
  })

  get(['/', '/:dependencyType/:dependencyName'], async (req, res) => {
    const dependencyType = getDependencyType(req)
    const dependencyName = getDependencyName(req)

    const { dependencyTypes, dependencyNames } = await getDropDownOptions(
      serviceCatalogueService,
      `${dependencyType}::${dependencyName}`,
    )

    return res.render('pages/dependencies', {
      dependencyTypes,
      dependencyNames,
      dependencyType,
      dependencyName,
    })
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

  const dependencyTypesSet = new Set<string>()
  const dependencyNamesSet = new Set<string>()

  dependencies.forEach(dependency => {
    const [type, name] = dependency.split('::')
    if (type) dependencyTypesSet.add(type)
    if (name) dependencyNamesSet.add(name)
  })

  const dependencyTypes: SelectList[] = Array.from(dependencyTypesSet).map(type => ({
    value: type,
    text: type,
    selected: currentDependency.startsWith(type),
  }))

  const dependencyNames: SelectList[] = Array.from(dependencyNamesSet).map(name => ({
    value: name,
    text: name,
    selected: currentDependency.endsWith(name),
  }))

  dependencyTypes.unshift({ value: '', text: 'Please select' })
  dependencyNames.unshift({ value: '', text: 'Please select' })

  return { dependencyTypes, dependencyNames }
}
