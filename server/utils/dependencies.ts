import type { ServiceCatalogueService, Services } from '../services'

export async function getDependencyTypes(serviceCatalogueService: ServiceCatalogueService) {
  const components = await serviceCatalogueService.getComponents()
  const typesSet = new Set<string>()

  components.forEach(component => {
    const versions = component.attributes?.versions
    if (versions) {
      Object.keys(versions).forEach(type => typesSet.add(type))
    }
  })

  return Array.from(typesSet).map(type => ({ value: type, text: type }))
}

export async function getDependencyNames(serviceCatalogueService: ServiceCatalogueService, dependencyType: string) {
  const components = await serviceCatalogueService.getComponents()
  const namesSet = new Set<string>()

  components.forEach(component => {
    const versions = component.attributes?.versions as Record<string, Record<string, string>>
    if (versions && versions[dependencyType]) {
      Object.keys(versions[dependencyType]).forEach(name => namesSet.add(name))
    }
  })

  return Array.from(namesSet).map(name => ({ value: name, text: name }))
}
