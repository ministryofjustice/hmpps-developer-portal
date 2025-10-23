import { type Request } from 'express'
import { BadRequest } from 'http-errors'
import {
  convertToTitleCase,
  initialiseName,
  getNumericId,
  getMonitorType,
  getMonitorName,
  getComponentName,
  getEnvironmentName,
  getDependencyType,
  getDependencyName,
  formatMonitorName,
  isValidDropDown,
  formatActiveAgencies,
  relativeTimeFromNow,
  veracodeFilters,
  associateBy,
  groupBy,
  differenceInDate,
  median,
  mapToCanonicalEnv,
  createStrapiQuery,
  formatTimeStamp,
} from './utils'

describe('Utils', () => {
  describe('convert to title case', () => {
    it.each([
      [null, null, ''],
      ['empty string', '', ''],
      ['Lower case', 'robert', 'Robert'],
      ['Upper case', 'ROBERT', 'Robert'],
      ['Mixed case', 'RoBErT', 'Robert'],
      ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
      ['Leading spaces', '  RobeRT', '  Robert'],
      ['Trailing spaces', 'RobeRT  ', 'Robert  '],
      ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
    ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
      expect(convertToTitleCase(a)).toEqual(expected)
    })
  })

  describe('initialise name', () => {
    it.each([
      [null, null, null],
      ['Empty string', '', null],
      ['One word', 'robert', 'r. robert'],
      ['Two words', 'Robert James', 'R. James'],
      ['Three words', 'Robert James Smith', 'R. Smith'],
      ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
    ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
      expect(initialiseName(a)).toEqual(expected)
    })
  })

  describe('getNumericId', () => {
    it('should return a Bad Request when a non-numeric parameter is supplied', () => {
      const mockRequest = { params: { teamId: 'x' } } as unknown as Request

      expect(() => getNumericId(mockRequest, 'teamId')).toThrow(new BadRequest())
    })

    it('should return the value of the supplied param when a numeric parameter is supplied', () => {
      const mockRequest = { params: { teamId: '0' } } as unknown as Request

      expect(getNumericId(mockRequest, 'teamId')).toBe(0)
    })
  })

  describe('getMonitorType', () => {
    it.each([
      ['Valid type product', 'product', 'product'],
      ['Valid type team', 'team', 'team'],
      ['Valid type service area', 'service-area', 'service-area'],
      ['Invalid type test23', 'test23', 'all'],
      ['Empty type', '', 'all'],
    ])('%s getMonitorType() with "%s" should return "%s"', (_: string, a: string, expected: string) => {
      const mockRequest = { params: { monitorType: a } } as unknown as Request

      expect(getMonitorType(mockRequest)).toBe(expected)
    })
  })

  describe('getMonitorName', () => {
    it.each([
      ['Already clean', 'product', 'product'],
      ['Already clean', 'ae-099', 'ae-099'],
      ['Invalid characters', 'ADso-+0', 'so-0'],
      ['Invalid characters', 'AD+', ''],
      ['Empty string', '', ''],
    ])('%s getMonitorType() with "%s" should return "%s"', (_: string, a: string, expected: string) => {
      const mockRequest = { params: { monitorName: a } } as unknown as Request

      expect(getMonitorName(mockRequest)).toBe(expected)
    })
  })

  describe('getComponentName', () => {
    it.each([
      ['Already clean', 'product', 'product'],
      ['Already clean', 'ae-099', 'ae-099'],
      ['Invalid characters', 'ADs=o-+0._%^', 'ADso-0._'],
      ['Invalid characters', ';"£', ''],
      ['Empty string', '', ''],
    ])('%s getComponentName() with "%s" should return "%s"', (_: string, a: string, expected: string) => {
      const mockRequest = { params: { componentName: a } } as unknown as Request

      expect(getComponentName(mockRequest)).toBe(expected)
    })
  })

  describe('getEnvironmentName', () => {
    it.each([
      ['Valid name dev', 'dev', 'dev'],
      ['Valid name development', 'development', 'development'],
      ['Valid name staging', 'staging', 'staging'],
      ['Valid name stage', 'stage', 'stage'],
      ['Valid name preprod', 'preprod', 'preprod'],
      ['Valid name prod', 'prod', 'prod'],
      ['Valid name production', 'production', 'production'],
      ['Valid name test', 'test', 'test'],
      ['Valid name test-cp', 'test-cp', 'test-cp'],
      ['Cleaned name &23', '&23', '23'],
      ['Empty name', '', ''],
    ])('%s getEnvironmentName() with "%s" should return "%s"', (_: string, a: string, expected: string) => {
      const mockRequest = { params: { environmentName: a } } as unknown as Request

      expect(getEnvironmentName(mockRequest)).toBe(expected)
    })
  })

  describe('mapToCanonicalEnv', () => {
    it('should return "dev" for environment names starting with "dev"', () => {
      expect(mapToCanonicalEnv('dev')).toBe('dev')
      expect(mapToCanonicalEnv('development')).toBe('dev')
    })
    it('should return "test" for environment names starting with "test"', () => {
      expect(mapToCanonicalEnv('test')).toBe('test')
      expect(mapToCanonicalEnv('test1')).toBe('test')
    })
    it('should return "stage" for environment names starting with "stag"', () => {
      expect(mapToCanonicalEnv('stage')).toBe('stage')
      expect(mapToCanonicalEnv('staging')).toBe('stage')
    })
    it('should return "uat" for environment names starting with "uat"', () => {
      expect(mapToCanonicalEnv('uat')).toBe('uat')
      expect(mapToCanonicalEnv('user1')).toBe('uat')
    })
    it('should return "preprod" for environment names starting with "pre"', () => {
      expect(mapToCanonicalEnv('preprod')).toBe('preprod')
      expect(mapToCanonicalEnv('preproduction')).toBe('preprod')
    })
    it('should return "prod" for environment names starting with "prod"', () => {
      expect(mapToCanonicalEnv('prod')).toBe('prod')
      expect(mapToCanonicalEnv('live')).toBe('prod')
      expect(mapToCanonicalEnv('prd')).toBe('prod')
      expect(mapToCanonicalEnv('live')).toBe('prod')
    })
  })

  describe('getDependencyType', () => {
    it.each([
      ['Valid type helm', 'helm', 'helm'],
      ['Valid type circleci', 'circleci', 'circleci'],
      ['Valid type dockerfile', 'dockerfile', 'dockerfile'],
      ['Invalid type &^%', '&^%', ''],
      ['Empty type', '', ''],
    ])('%s getDependencyType() with "%s" should return "%s"', (_: string, a: string, expected: string) => {
      const mockRequest = { params: { dependencyType: a } } as unknown as Request

      expect(getDependencyType(mockRequest)).toBe(expected)
    })
  })

  describe('getDependencyName', () => {
    it.each([
      ['Already clean', 'product', 'product'],
      ['Already clean', 'ae-0_99', 'ae-0_99'],
      ['Invalid characters', 'ADso-+0', 'ADso-0'],
      ['Invalid characters', 'AD+', 'AD'],
      ['Empty string', '', ''],
    ])('%s getDependencyName() with "%s" should return "%s"', (_: string, a: string, expected: string) => {
      const mockRequest = { params: { dependencyName: a } } as unknown as Request

      expect(getDependencyName(mockRequest)).toBe(expected)
    })
  })

  describe('formatMonitorName', () => {
    it.each([
      ['No replacements', 'monitorname', 'monitorname'],
      ['Some uppercase', 'monitORname', 'monitorname'],
      ['With spaces', 'monitor name', 'monitor-name'],
      ['Multiple dashes', 'monitor--name', 'monitor-name'],
      ['Invalid characters', '?%+', ''],
      ['Empty name', '', ''],
    ])('%s formatMonitorName("%s") should return "%s"', (_: string, a: string, expected: string) => {
      expect(formatMonitorName(a)).toBe(expected)
    })
  })

  describe('isValidDropDown', () => {
    it.each([
      ['Valid', 'product', true],
      ['Valid', 'product-2-de', true],
      ['Invalid', '%^$kjg', false],
      ['Invalid', 'product-2-De', false],
      ['Invalid', 'product 2 De ^% l', false],
      ['Empty string', '', false],
    ])('%s isValidDropDown() with "%s" should return "%s"', (_: string, a: string, expected: boolean) => {
      const mockRequest = { query: { paramName: a } } as unknown as Request

      expect(isValidDropDown(mockRequest, 'paramName')).toBe(expected)
    })
  })
})

describe('formatActiveAgencies', () => {
  it.each([
    ['undefined', undefined, 'Not set'],
    ['all agencies token', ['***'], 'All agencies'],
    ['a list of agencies', ['ABC', 'DEF', 'GHI'], 'ABC, DEF, GHI'],
  ])(
    '%s is passed to formatActiveAgencies(), value "%s" should return "%s"',
    (_: string, input: string[], expected: string) => {
      expect(formatActiveAgencies(input)).toBe(expected)
    },
  )
})

describe('relativeTimeFromNow', () => {
  it.each([
    ['in 1 hour', new Date(new Date().getTime() + 1000 * 60 * 60), 'in an hour'],
    ['in a few seconds', new Date(new Date().getTime() + 4000), 'in a few seconds'],
    ['a few seconds ago', new Date(new Date().getTime() - 4000), 'a few seconds ago'],
    ['3 minutes ago', new Date(new Date().getTime() - 1 * 60 * 1000 * 3), '3 minutes ago'],
    ['4 hours ago', new Date(new Date().getTime() - 1 * 60 * 1000 * 4 * 60), '4 hours ago'],
    ['5 days ago', new Date(new Date().getTime() - 1 * 60 * 1000 * 5 * 60 * 24), '5 days ago'],
  ])(
    '%s is passed to relativeTimeFromNow(), value "%s" should return "%s"',
    (_: string, input: Date, expected: string) => {
      expect(relativeTimeFromNow(input)).toBe(expected)
    },
  )
})

describe('veracodeFilters', () => {
  it.each([
    [true, true, true, null, true],
    [true, true, true, 'Pass', true],
    [true, true, true, 'Did Not Pass', true],
    [false, false, false, null, true],
    [false, false, false, 'Pass', true],
    [false, false, false, 'Did Not Pass', true],
    [true, false, false, 'Pass', true],
    [true, false, false, 'Did Not Pass', false],
    [true, false, false, null, false],
    [true, true, false, 'Pass', true],
    [true, true, false, 'Did Not Pass', true],
    [true, true, false, null, false],
    [true, false, true, 'Pass', true],
    [true, false, true, null, true],
    [true, false, true, 'Did Not Pass', false],
    [false, true, false, 'Did Not Pass', true],
    [false, true, false, 'Pass', false],
    [false, true, false, null, false],
    [false, false, true, null, true],
    [false, false, true, 'Pass', false],
    [false, false, true, 'Did Not Pass', false],
    [false, true, true, 'Did Not Pass', true],
    [false, true, true, 'Pass', false],
    [false, true, true, null, true],
  ])(
    'Passed is %s, failed is %s, unknown is %s and status is "%s" it should return %s',
    (passed: boolean, failed: boolean, unknown: boolean, status: 'string', expected: boolean) => {
      expect(veracodeFilters(passed, failed, unknown, status)).toBe(expected)
    },
  )

  describe('associateBy', () => {
    it('empty', () => {
      const names: string[] = []
      expect(associateBy(names, name => `${name.length}`)).toStrictEqual({})
    })

    it('example', () => {
      const names: string[] = ['one', 'two', 'three', 'four']
      expect(associateBy(names, name => `${name.length}`)).toStrictEqual({ '3': 'two', '4': 'four', '5': 'three' })
    })
  })

  describe('groupBy', () => {
    it('empty', () => {
      const names: string[] = []
      expect(groupBy(names, name => `${name.length}`)).toStrictEqual({})
    })

    it('example', () => {
      const names: string[] = ['one', 'two', 'three', 'four']
      expect(groupBy(names, name => `${name.length}`)).toStrictEqual({
        '3': ['one', 'two'],
        '4': ['four'],
        '5': ['three'],
      })
    })
  })

  describe('differenceInDate', () => {
    it('missing both', () => {
      expect(differenceInDate(undefined, undefined)).toStrictEqual({
        days: 0,
        description: 'not available',
        hours: 0,
        millis: 0,
        present: false,
        sortValue: Number.MIN_SAFE_INTEGER,
      })
    })

    it('missing from', () => {
      expect(differenceInDate(undefined, new Date())).toStrictEqual({
        days: 0,
        description: 'not available',
        hours: 0,
        millis: 0,
        present: false,
        sortValue: Number.MIN_SAFE_INTEGER,
      })
    })

    it('missing to', () => {
      expect(differenceInDate(new Date(), undefined)).toStrictEqual({
        days: 0,
        description: 'not available',
        hours: 0,
        millis: 0,
        present: false,
        sortValue: Number.MIN_SAFE_INTEGER,
      })
    })

    it('same date', () => {
      const date = new Date()
      expect(differenceInDate(date, date)).toStrictEqual({
        days: 0,
        description: 'no difference',
        hours: 0,
        millis: 0,
        present: true,
        sortValue: 0,
      })
    })

    it('small difference in dates', () => {
      const from = new Date()
      const to = new Date(from.getTime() + 1000)
      expect(differenceInDate(from, to)).toStrictEqual({
        days: 0,
        description: 'a few seconds',
        hours: 0,
        millis: -1000,
        present: true,
        sortValue: 0,
      })
    })

    it('different dates', () => {
      const from = new Date()
      // 28 hours in the future
      const to = new Date(from.getTime() + 1000 * 60 * 60 * 28)
      expect(differenceInDate(from, to)).toStrictEqual({
        days: -1,
        description: 'a day',
        hours: -28,
        millis: -100800000,
        present: true,
        sortValue: -1,
      })
    })
  })

  describe('median', () => {
    it('empty', () => {
      expect(median([])).toStrictEqual(undefined)
    })

    it('single value', () => {
      expect(median([1])).toStrictEqual(1)
    })

    it('odd number of elements', () => {
      expect(median([1, 2, 3, 4, 5])).toStrictEqual(3)
    })

    it('even number of elements', () => {
      expect(median([1, 2, 3, 4])).toStrictEqual(2.5)
    })
  })
  describe('createStrapiQuery', () => {
    it.each([
      [null, { populate: null }, ''],
      ['empty array', { populate: [] }, ''],
      ['Single item', { populate: ['product_set'] }, 'populate%5Bproduct_set%5D=true'],
      [
        'Multiple items',
        { populate: ['product_set', 'team'] },
        'populate%5Bproduct_set%5D=true&populate%5Bteam%5D=true',
      ],
      ['Single dotted entry', { populate: ['product.team'] }, 'populate%5Bproduct%5D%5Bpopulate%5D%5Bteam%5D=true'],
      [
        'Multiple dotted entries',
        { populate: ['product.team', 'envs.trivy_scan'] },
        'populate%5Bproduct%5D%5Bpopulate%5D%5Bteam%5D=true&populate%5Benvs%5D%5Bpopulate%5D%5Btrivy_scan%5D=true',
      ],
      [
        'Single deep dotted entry',
        { populate: ['product.team.extra'] },
        'populate%5Bproduct%5D%5Bpopulate%5D%5Bteam%5D%5Bpopulate%5D%5Bextra%5D=true',
      ],
      [
        'Multiple deep dotted entries',
        { populate: ['product.team.extra', 'envs.trivy_scan.extra'] },
        'populate%5Bproduct%5D%5Bpopulate%5D%5Bteam%5D%5Bpopulate%5D%5Bextra%5D=true&populate%5Benvs%5D%5Bpopulate%5D%5Btrivy_scan%5D%5Bpopulate%5D%5Bextra%5D=true',
      ],
      [
        'Nested entries with hierarchical structure',
        { populate: ['products.components.envs', 'products', 'products.components'] },
        'populate%5Bproducts%5D%5Bpopulate%5D%5Bcomponents%5D%5Bpopulate%5D%5Benvs%5D=true',
      ],
    ])('%s createStrapiQuery(%s)', (_: string, input: { populate?: string[] }, expected: string) => {
      expect(createStrapiQuery(input)).toEqual(expected)
    })
  })
})

describe('formatTimeStamp', () => {
  it('returns N/A when given an empty string', () => {
    expect(formatTimeStamp('')).toEqual('N/A')
  })

  it('returns invalid date when give a string instead of number', () => {
    expect(formatTimeStamp('string')).toEqual('Invalid date')
  })

  it('formats the date correctly', () => {
    expect(formatTimeStamp('05.12.2025')).toEqual('12 MAY 2025 00:00:00')
  })

  it('formats the date and time correctly', () => {
    expect(formatTimeStamp('05.12.2025 10:12:12')).toEqual('12 MAY 2025 10:12:12')
  })
})
