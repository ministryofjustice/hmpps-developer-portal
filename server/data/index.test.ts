import { dataAccess, StrapiApiClient, AlertsApiClient } from './index'

jest.mock('../utils/azureAppInsights')
jest.mock('../applicationInfo', () => () => ({
  applicationName: 'hmpps-developer-portal',
  buildNumber: '123',
  gitRef: 'abc123',
  gitShortHash: 'abc123',
  branchName: 'main',
}))
jest.mock('./strapiApiClient')
jest.mock('./alertsApiClient')

describe('server/data/index', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('dataAccess function', () => {
    let dataAccessResult: ReturnType<typeof dataAccess>

    beforeEach(() => {
      dataAccessResult = dataAccess()
    })

    it('should return an object with required properties', () => {
      expect(dataAccessResult).toHaveProperty('applicationInfo')
      expect(dataAccessResult).toHaveProperty('strapiApiClientBuilder')
      expect(dataAccessResult).toHaveProperty('alertsApiClient')
    })

    it('should include application info in the result', () => {
      expect(dataAccessResult.applicationInfo).toEqual({
        applicationName: 'hmpps-developer-portal',
        buildNumber: '123',
        gitRef: 'abc123',
        gitShortHash: 'abc123',
        branchName: 'main',
      })
    })

    it('should provide a strapi API client builder function', () => {
      expect(typeof dataAccessResult.strapiApiClientBuilder).toBe('function')
    })

    it('should provide an alerts API client builder function', () => {
      expect(typeof dataAccessResult.alertsApiClient).toBe('function')
    })

    it('should create new StrapiApiClient instances when builder is called', () => {
      const client1 = dataAccessResult.strapiApiClientBuilder('token1')
      const client2 = dataAccessResult.strapiApiClientBuilder('token2')

      expect(client1).toBeInstanceOf(StrapiApiClient)
      expect(client2).toBeInstanceOf(StrapiApiClient)
      expect(client1).not.toBe(client2) // Should be different instances
    })

    it('should create new AlertsApiClient instances when builder is called', () => {
      const client1 = dataAccessResult.alertsApiClient('token1')
      const client2 = dataAccessResult.alertsApiClient('token2')

      expect(client1).toBeInstanceOf(AlertsApiClient)
      expect(client2).toBeInstanceOf(AlertsApiClient)
      expect(client1).not.toBe(client2) // Should be different instances
    })
  })

  describe('Type Exports', () => {
    it('should export StrapiApiClient class', () => {
      expect(StrapiApiClient).toBeDefined()
      expect(typeof StrapiApiClient).toBe('function') // Constructor function
    })

    it('should export AlertsApiClient class', () => {
      expect(AlertsApiClient).toBeDefined()
      expect(typeof AlertsApiClient).toBe('function') // Constructor function
    })

    it('should have correct DataAccess type structure', () => {
      const dataAccessInstance = dataAccess()

      // Type checking through runtime validation
      expect(dataAccessInstance).toHaveProperty('applicationInfo')
      expect(dataAccessInstance).toHaveProperty('strapiApiClientBuilder')
      expect(dataAccessInstance).toHaveProperty('alertsApiClient')

      // Verify the builders are functions
      expect(typeof dataAccessInstance.strapiApiClientBuilder).toBe('function')
      expect(typeof dataAccessInstance.alertsApiClient).toBe('function')
    })
  })

  describe('Client Builder Functions', () => {
    it('should accept token parameter in strapi client builder', () => {
      const dataAccessInstance = dataAccess()
      const testToken = 'test-token-123'

      expect(() => {
        dataAccessInstance.strapiApiClientBuilder(testToken)
      }).not.toThrow()
    })

    it('should accept token parameter in alerts client builder', () => {
      const dataAccessInstance = dataAccess()
      const testToken = 'test-token-456'

      expect(() => {
        dataAccessInstance.alertsApiClient(testToken)
      }).not.toThrow()
    })

    it('should handle empty string tokens', () => {
      const dataAccessInstance = dataAccess()

      expect(() => {
        dataAccessInstance.strapiApiClientBuilder('')
        dataAccessInstance.alertsApiClient('')
      }).not.toThrow()
    })

    it('should handle various token formats', () => {
      const dataAccessInstance = dataAccess()
      const tokens = ['Bearer abc123', 'jwt-token-here', 'simple-token', '123456789', 'token-with-special-chars!@#$%']

      tokens.forEach(token => {
        expect(() => {
          dataAccessInstance.strapiApiClientBuilder(token)
          dataAccessInstance.alertsApiClient(token)
        }).not.toThrow()
      })
    })
  })

  describe('Module Structure', () => {
    it('should maintain consistent return structure across multiple calls', () => {
      const result1 = dataAccess()
      const result2 = dataAccess()

      // Should have same structure
      expect(Object.keys(result1)).toEqual(Object.keys(result2))

      // Application info should be the same (same reference)
      expect(result1.applicationInfo).toBe(result2.applicationInfo)

      // Builder functions should be different instances
      expect(result1.strapiApiClientBuilder).not.toBe(result2.strapiApiClientBuilder)
      expect(result1.alertsApiClient).not.toBe(result2.alertsApiClient)
    })

    it('should export all required types and classes', () => {
      // Verify exports exist
      expect(dataAccess).toBeDefined()
      expect(StrapiApiClient).toBeDefined()
      expect(AlertsApiClient).toBeDefined()

      // Verify they are the correct types
      expect(typeof dataAccess).toBe('function')
      expect(typeof StrapiApiClient).toBe('function')
      expect(typeof AlertsApiClient).toBe('function')
    })
  })

  describe('Integration with Application Info', () => {
    it('should use the same application info instance across data access calls', () => {
      const result1 = dataAccess()
      const result2 = dataAccess()

      expect(result1.applicationInfo).toBe(result2.applicationInfo)
      expect(result1.applicationInfo).toEqual({
        applicationName: 'hmpps-developer-portal',
        buildNumber: '123',
        gitRef: 'abc123',
        gitShortHash: 'abc123',
        branchName: 'main',
      })
    })

    it('should use the same application info across multiple dataAccess calls', () => {
      const result1 = dataAccess()
      const result2 = dataAccess()

      // Application info should be consistent
      expect(result1.applicationInfo).toEqual(result2.applicationInfo)
    })
  })
})
