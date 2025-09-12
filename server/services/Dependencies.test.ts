import Dependencies from './Dependencies'
import { DependencyInfo } from '../data/dependencyInfoTypes'

describe('Dependencies', () => {
  let dependencyInfo: DependencyInfo

  beforeEach(() => {
    dependencyInfo = {
      PROD: {
        categoryToComponent: { categoryA: ['componentA'] },
        componentDependencyInfo: {
          componentA: {
            dependencies: {
              components: ['componentB'],
              categories: ['categoryA'],
              other: [{ name: 'otherService', type: 'http' }],
            },
            dependents: [{ name: 'componentC', isKnownComponent: true }],
          },
          componentB: {
            dependencies: {
              components: ['componentC'],
              categories: ['categoryB'],
              other: [{ name: 'externalService', type: 'api' }],
            },
            dependents: [{ name: 'componentD', isKnownComponent: false }],
          },
          componentC: {
            dependencies: {
              components: [],
              categories: [],
              other: [],
            },
            dependents: [],
          },
        },
        missingServices: ['exampleApi1'],
      },
      PREPROD: {
        categoryToComponent: {},
        componentDependencyInfo: {},
        missingServices: ['unknownHost1'],
      },
      DEV: {
        categoryToComponent: {},
        componentDependencyInfo: {},
        missingServices: [],
      },
    }
  })

  describe('getDependencies', () => {
    it('should return correct dependencies for a component', () => {
      const dependencies = new Dependencies(dependencyInfo)
      const results = dependencies.getDependencies('componentA')

      expect(results.categories).toEqual(['categoryA'])
      expect(results.dependencies).toEqual({ componentB: true, otherService: false })
      expect(results.dependents).toEqual({ componentC: true })
    })

    it('should filter out localhost and Http from dependencies for a component', () => {
      dependencyInfo.PROD.componentDependencyInfo.componentA.dependencies.other.push({
        name: 'localhost',
        type: 'http',
      })
      dependencyInfo.PROD.componentDependencyInfo.componentA.dependencies.other.push({ name: 'Http', type: 'http' })

      const dependencies = new Dependencies(dependencyInfo)
      const results = dependencies.getDependenciesForComponents(['componentA'])

      expect(results.dependencies).not.toHaveProperty('localhost')
      expect(results.dependencies).not.toHaveProperty('Http')
    })
  })

  describe('getDependenciesForComponents', () => {
    it('should return correct dependencies for multiple components', () => {
      const dependencies = new Dependencies(dependencyInfo)
      const results = dependencies.getDependenciesForComponents(['componentA', 'componentB'])

      expect(results.categories).toEqual(['categoryA', 'categoryB'])
      expect(results.dependencies).toEqual({
        componentB: true,
        otherService: false,
        componentC: true,
        externalService: false,
      })
      expect(results.dependents).toEqual({ componentC: true, componentD: false })
    })

    it('should return empty arrays for unknown components', () => {
      const dependencies = new Dependencies(dependencyInfo)
      const results = dependencies.getDependenciesForComponents(['unknownComponent'])

      expect(results.categories).toEqual([])
      expect(results.dependencies).toEqual({})
      expect(results.dependents).toEqual({})
    })
  })

  describe('getAllUnknownHosts', () => {
    it('should return missing services from all environments', () => {
      const dependencies = new Dependencies(dependencyInfo)

      expect(dependencies.getAllUnknownHosts()).toEqual(['exampleApi1', 'unknownHost1'])
    })
  })
})
