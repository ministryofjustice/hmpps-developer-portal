import { type Request } from 'express'
import { BadRequest } from 'http-errors'
import * as dayjs from 'dayjs'
import * as relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime.default)

type HasName = { attributes?: { name: string } }

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const getNumericId = (req: Request, paramName: string): number => {
  const id = req.params[paramName]

  if (!Number.isInteger(Number.parseInt(id, 10))) {
    throw new BadRequest()
  }

  return Number.parseInt(id, 10)
}

export const getMonitorType = (req: Request): string => {
  const { monitorType } = req.params

  return ['product', 'team', 'serviceArea', 'customComponentView'].includes(monitorType) ? monitorType : 'all'
}

export const getMonitorName = (req: Request): string => {
  const monitorName = req.params?.monitorName || ''

  return monitorName.replace(/[^-a-z0-9]/g, '')
}

export const formatMonitorName = (name: string): string => {
  const monitorName = name || ''

  return `${monitorName}`
    .trim()
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^-a-z0-9]/g, '')
    .replace(/-+/g, '-')
}

export const sortData = (dataItem: HasName, compareDataItem: HasName) => {
  if (dataItem.attributes.name < compareDataItem.attributes.name) {
    return -1
  }
  if (dataItem.attributes.name > compareDataItem.attributes.name) {
    return 1
  }

  return 0
}

export const getComponentName = (req: Request): string => {
  const { componentName } = req.params

  return componentName.replace(/[^-a-zA-Z0-9_.]/g, '')
}

export const getSanitizedValue = (req: Request, value: string): string => {
  const valueToBeSanitized = req.params[value] || ''

  return valueToBeSanitized.replace(/[^-a-z0-9_]/g, '')
}

export const isValidDropDown = (req: Request, paramName: string): boolean => {
  const param = req.query[paramName] as string

  return param !== undefined && /^[a-z0-9_-]+$/.test(param)
}
/**
 * @param activeAgencies a list of agencies if available.
 * @returns formatted version of the agencies.
 */
export const formatActiveAgencies = (activeAgencies: Array<string>) => {
  if (!activeAgencies || activeAgencies.length < 1) {
    return 'Not set'
  }
  if (activeAgencies.includes('***')) {
    return 'All agencies'
  }
  return activeAgencies.join(',')
}

export const relativeTimeFromNow = (date: Date): string => {
  return dayjs.default().to(dayjs.default(date))
}

export const veracodeFilters = (passed: boolean, failed: boolean, unknown: boolean, status: string) => {
  if ((passed && failed && unknown) || (!passed && !failed && !unknown)) {
    return true
  }

  if (passed && status === 'Pass') {
    return true
  }

  if (failed && status === 'Did Not Pass') {
    return true
  }

  if (unknown && status === null) {
    return true
  }

  return false
}
