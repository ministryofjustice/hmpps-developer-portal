import { Router } from 'express'
import type { ServiceCatalogueService, Services } from '../services'
import { getDependencyName, getDependencyType, getDependencyNames } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.get('/dependency-names/:dependencyType', async (req, res) => {
    const { dependencyType } = req.params
    const dependencyNames = await getDependencyNames(serviceCatalogueService, dependencyType)
    res.json(dependencyNames)
  })

  router.get('/data/:dependencyType/:dependencyName', async (req, res) => {
    const dependencyType = getDependencyType(req)
    const dependencyName = getDependencyName(req).replace(/~/g, '/')

    const components = await serviceCatalogueService.getComponents()

    const displayComponents = components
      .filter(component => {
        // @ts-expect-error Suppress any declaration
        if (component.versions && component.versions[dependencyType]) {
          // @ts-expect-error Suppress any declaration
          return component.versions[dependencyType][dependencyName]
        }

        return false
      })
      .map(component => {
        // @ts-expect-error Suppress any declaration
        const dependencyData = component.versions?.[dependencyType]?.[dependencyName]
        const githubRepo = component.github_repo ?? ''

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
          componentName: component?.name ?? '',
          dependencyVersion,
          location: githubUrl,
        }
      })

    res.send(displayComponents)
  })

  router.get(['/', '/:dependencyType/:dependencyName'], async (req, res) => {
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

  const [currentType, currentName] = currentDependency.split('::')

  dependencies.forEach(dependency => {
    const [type, name] = dependency.split('::')
    if (type) dependencyTypesSet.add(type)
    if (type === currentType && name) {
      dependencyNamesSet.add(name)
    }
  })

  const dependencyTypes: SelectList[] = Array.from(dependencyTypesSet).map(type => ({
    value: type,
    text: type,
    selected: type === currentType,
  }))

  const dependencyNames: SelectList[] = Array.from(dependencyNamesSet).map(name => ({
    value: name,
    text: name,
    selected: name === currentName,
  }))

  dependencyTypes.unshift({ value: '', text: 'Please select' })
  dependencyNames.unshift({ value: '', text: 'Please select' })

  return { dependencyTypes, dependencyNames }
}
