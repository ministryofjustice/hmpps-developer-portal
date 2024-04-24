type DependencyReference = { name: string; type: string }

type Dependent = { name: string; isKnownComponent: boolean }

type ComponentDependencyInfo = {
  dependencies: {
    components: string[]
    categories: string[]
    other: DependencyReference[]
  }
  dependents: Dependent[]
}

type EnvType = 'PROD' | 'PREPROD' | 'DEV'

type EnvDependencyInfo = {
  categoryToComponent: Record<string, string[]>
  componentDependencyInfo: Record<string, ComponentDependencyInfo>
  missingServices: string[]
}

export type DependencyInfo = Record<EnvType, EnvDependencyInfo>
