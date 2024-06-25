import { DependencyInfo } from '../data/dependencyInfoTypes'

export default class Dependencies {
  constructor(private readonly dependencyInfo: DependencyInfo) {}

  public getDependencies(componentName: string): {
    categories: string[]
    dependencies: Record<string, boolean>
    dependents: Record<string, boolean>
  } {
    return this.getDependenciesForComponents([componentName])
  }

  public getDependenciesForComponents(componentNames: string[]): {
    categories: string[]
    dependencies: Record<string, boolean>
    dependents: Record<string, boolean>
  } {
    const dependencyInfo = Object.values(this.dependencyInfo)
      .flatMap(e => Object.entries(e.componentDependencyInfo))
      .filter(([name]) => componentNames.includes(name))
      .map(([, dependency]) => dependency)

    const categories = dependencyInfo.flatMap(component => component.dependencies?.categories)
    const dependencies = dependencyInfo
      .flatMap(component => {
        const known = component.dependencies?.components?.map(comp => [comp, true]) || []
        const unknown = (component.dependencies?.other || [])
          .filter(({ name }) => !name.toLowerCase().includes('localhost') && name !== 'Http')
          .map(({ name }) => [name, false])
        return known.concat(unknown) as [[name: string, known: boolean]]
      })
      .sort(([a], [b]) => a.localeCompare(b))

    const dependents = dependencyInfo
      .flatMap(component => component.dependents)
      .sort((a, b) => a.name.localeCompare(b.name))
      .reduce(
        (acc, component) => {
          acc[component.name] = acc[component.name] || component.isKnownComponent
          return acc
        },
        {} as Record<string, boolean>,
      )

    return {
      categories: Array.from(new Set(categories)),
      dependencies: Object.fromEntries(dependencies),
      dependents,
    }
  }
}
