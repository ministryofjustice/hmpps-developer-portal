import { DependencyInfo } from './dependencyInfoTypes'

describe('DependencyInfoTypes', () => {
  describe('Type Structure Validation', () => {
    it('should accept valid DependencyInfo structure', () => {
      const validDependencyInfo: DependencyInfo = {
        PROD: {
          categoryToComponent: {
            'web-service': ['component-a', 'component-b'],
            database: ['postgres-db'],
          },
          componentDependencyInfo: {
            'component-a': {
              dependencies: {
                components: ['component-b', 'component-c'],
                categories: ['database', 'messaging'],
                other: [
                  { name: 'external-api', type: 'REST API' },
                  { name: 'redis-cache', type: 'Cache' },
                ],
              },
              dependents: [
                { name: 'frontend-app', isKnownComponent: true },
                { name: 'legacy-system', isKnownComponent: false },
              ],
            },
          },
          missingServices: ['unknown-service-1', 'unknown-service-2'],
        },
        PREPROD: {
          categoryToComponent: {
            'web-service': ['component-a'],
          },
          componentDependencyInfo: {
            'component-a': {
              dependencies: {
                components: ['component-b'],
                categories: ['database'],
                other: [{ name: 'test-api', type: 'Mock API' }],
              },
              dependents: [{ name: 'test-client', isKnownComponent: true }],
            },
          },
          missingServices: [],
        },
        DEV: {
          categoryToComponent: {},
          componentDependencyInfo: {},
          missingServices: [],
        },
      }

      // If this compiles without TypeScript errors, the type structure is valid
      expect(validDependencyInfo).toBeDefined()
      expect(validDependencyInfo.PROD).toBeDefined()
      expect(validDependencyInfo.PREPROD).toBeDefined()
      expect(validDependencyInfo.DEV).toBeDefined()
    })

    it('should handle empty dependency info structure', () => {
      const emptyDependencyInfo: DependencyInfo = {
        PROD: {
          categoryToComponent: {},
          componentDependencyInfo: {},
          missingServices: [],
        },
        PREPROD: {
          categoryToComponent: {},
          componentDependencyInfo: {},
          missingServices: [],
        },
        DEV: {
          categoryToComponent: {},
          componentDependencyInfo: {},
          missingServices: [],
        },
      }

      expect(emptyDependencyInfo).toBeDefined()
      expect(Object.keys(emptyDependencyInfo)).toEqual(['PROD', 'PREPROD', 'DEV'])
    })

    it('should validate ComponentDependencyInfo structure', () => {
      const componentInfo: DependencyInfo['PROD']['componentDependencyInfo']['component-name'] = {
        dependencies: {
          components: ['dep-component-1', 'dep-component-2'],
          categories: ['database', 'messaging', 'storage'],
          other: [
            { name: 'external-service', type: 'HTTP API' },
            { name: 'third-party-lib', type: 'Library' },
          ],
        },
        dependents: [
          { name: 'dependent-1', isKnownComponent: true },
          { name: 'dependent-2', isKnownComponent: false },
          { name: 'dependent-3', isKnownComponent: true },
        ],
      }

      expect(componentInfo.dependencies.components).toBeInstanceOf(Array)
      expect(componentInfo.dependencies.categories).toBeInstanceOf(Array)
      expect(componentInfo.dependencies.other).toBeInstanceOf(Array)
      expect(componentInfo.dependents).toBeInstanceOf(Array)
    })

    it('should validate DependencyReference structure', () => {
      const dependencyRefs: Array<{ name: string; type: string }> = [
        { name: 'postgres-db', type: 'Database' },
        { name: 'redis-cache', type: 'Cache' },
        { name: 'elasticsearch', type: 'Search Engine' },
        { name: 'external-api', type: 'REST API' },
      ]

      dependencyRefs.forEach(ref => {
        expect(typeof ref.name).toBe('string')
        expect(typeof ref.type).toBe('string')
        expect(ref.name.length).toBeGreaterThan(0)
        expect(ref.type.length).toBeGreaterThan(0)
      })
    })

    it('should validate Dependent structure', () => {
      const dependents: Array<{ name: string; isKnownComponent: boolean }> = [
        { name: 'known-component', isKnownComponent: true },
        { name: 'unknown-component', isKnownComponent: false },
        { name: 'legacy-system', isKnownComponent: false },
        { name: 'modern-service', isKnownComponent: true },
      ]

      dependents.forEach(dependent => {
        expect(typeof dependent.name).toBe('string')
        expect(typeof dependent.isKnownComponent).toBe('boolean')
        expect(dependent.name.length).toBeGreaterThan(0)
      })
    })

    it('should validate EnvType values', () => {
      const validEnvTypes: Array<'PROD' | 'PREPROD' | 'DEV'> = ['PROD', 'PREPROD', 'DEV']

      validEnvTypes.forEach(envType => {
        expect(['PROD', 'PREPROD', 'DEV']).toContain(envType)
      })
    })

    it('should handle complex nested dependency structures', () => {
      const complexDependencyInfo: DependencyInfo = {
        PROD: {
          categoryToComponent: {
            microservice: ['auth-service', 'user-service', 'payment-service'],
            database: ['postgres-main', 'redis-session'],
            messaging: ['rabbitmq-cluster'],
            monitoring: ['prometheus', 'grafana'],
          },
          componentDependencyInfo: {
            'auth-service': {
              dependencies: {
                components: ['user-service'],
                categories: ['database', 'messaging'],
                other: [
                  { name: 'oauth-provider', type: 'External OAuth' },
                  { name: 'jwt-library', type: 'Library' },
                ],
              },
              dependents: [
                { name: 'api-gateway', isKnownComponent: true },
                { name: 'frontend-app', isKnownComponent: true },
                { name: 'mobile-app', isKnownComponent: false },
              ],
            },
            'user-service': {
              dependencies: {
                components: [],
                categories: ['database'],
                other: [
                  { name: 'email-service', type: 'SMTP' },
                  { name: 'file-storage', type: 'S3' },
                ],
              },
              dependents: [
                { name: 'auth-service', isKnownComponent: true },
                { name: 'profile-service', isKnownComponent: true },
              ],
            },
          },
          missingServices: ['legacy-ldap', 'old-payment-gateway'],
        },
        PREPROD: {
          categoryToComponent: {
            microservice: ['auth-service', 'user-service'],
            database: ['postgres-test'],
          },
          componentDependencyInfo: {
            'auth-service': {
              dependencies: {
                components: ['user-service'],
                categories: ['database'],
                other: [{ name: 'mock-oauth', type: 'Mock Service' }],
              },
              dependents: [{ name: 'test-client', isKnownComponent: true }],
            },
          },
          missingServices: [],
        },
        DEV: {
          categoryToComponent: {
            microservice: ['auth-service'],
          },
          componentDependencyInfo: {
            'auth-service': {
              dependencies: {
                components: [],
                categories: [],
                other: [{ name: 'local-db', type: 'SQLite' }],
              },
              dependents: [],
            },
          },
          missingServices: [],
        },
      }

      expect(complexDependencyInfo).toBeDefined()
      expect(Object.keys(complexDependencyInfo.PROD.categoryToComponent)).toHaveLength(4)
      expect(Object.keys(complexDependencyInfo.PROD.componentDependencyInfo)).toHaveLength(2)
      expect(complexDependencyInfo.PROD.missingServices).toHaveLength(2)
    })
  })

  describe('Type Safety and Edge Cases', () => {
    it('should handle empty arrays in component dependencies', () => {
      const componentWithEmptyDeps: DependencyInfo['PROD']['componentDependencyInfo']['test'] = {
        dependencies: {
          components: [],
          categories: [],
          other: [],
        },
        dependents: [],
      }

      expect(componentWithEmptyDeps.dependencies.components).toEqual([])
      expect(componentWithEmptyDeps.dependencies.categories).toEqual([])
      expect(componentWithEmptyDeps.dependencies.other).toEqual([])
      expect(componentWithEmptyDeps.dependents).toEqual([])
    })

    it('should handle mixed isKnownComponent values', () => {
      const mixedDependents: Array<{ name: string; isKnownComponent: boolean }> = [
        { name: 'component-1', isKnownComponent: true },
        { name: 'component-2', isKnownComponent: false },
        { name: 'component-3', isKnownComponent: true },
        { name: 'component-4', isKnownComponent: false },
      ]

      const knownComponents = mixedDependents.filter(d => d.isKnownComponent)
      const unknownComponents = mixedDependents.filter(d => !d.isKnownComponent)

      expect(knownComponents).toHaveLength(2)
      expect(unknownComponents).toHaveLength(2)
    })

    it('should validate that all required environment types are present', () => {
      const dependencyInfo: DependencyInfo = {
        PROD: {
          categoryToComponent: {},
          componentDependencyInfo: {},
          missingServices: [],
        },
        PREPROD: {
          categoryToComponent: {},
          componentDependencyInfo: {},
          missingServices: [],
        },
        DEV: {
          categoryToComponent: {},
          componentDependencyInfo: {},
          missingServices: [],
        },
      }

      const requiredEnvs: Array<keyof DependencyInfo> = ['PROD', 'PREPROD', 'DEV']

      requiredEnvs.forEach(env => {
        expect(dependencyInfo[env]).toBeDefined()
        expect(dependencyInfo[env].categoryToComponent).toBeDefined()
        expect(dependencyInfo[env].componentDependencyInfo).toBeDefined()
        expect(dependencyInfo[env].missingServices).toBeDefined()
      })
    })
  })
})
