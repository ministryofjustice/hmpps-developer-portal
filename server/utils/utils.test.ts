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
      ['Valid type service area', 'serviceArea', 'serviceArea'],
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
      ['Invalid name test23', 'test23', ''],
      ['Empty name', '', ''],
    ])('%s getEnvironmentName() with "%s" should return "%s"', (_: string, a: string, expected: string) => {
      const mockRequest = { params: { environmentName: a } } as unknown as Request

      expect(getEnvironmentName(mockRequest)).toBe(expected)
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
      ['Invalid characters', 'ADso-+0', 'so-0'],
      ['Invalid characters', 'AD+', ''],
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
})
