import { type Request } from 'express'
import { BadRequest } from 'http-errors'
import * as dayjs from 'dayjs'
import * as relativeTime from 'dayjs/plugin/relativeTime'
import { formatDate } from 'date-fns'

import { RdsEntry } from '../@types'

dayjs.extend(relativeTime.default)

type HasName = { attributes?: { name: string } }
type HasRepoName = { attributes?: { github_repo: string } }
type HasTeamName = { attributes?: { team_name: string } }

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
  return dataItem.attributes.name.localeCompare(compareDataItem.attributes.name)
}

export const sortByName = (dataItem: { name: string }, compareDataItem: { name: string }) => {
  return dataItem.name.localeCompare(compareDataItem.name)
}

export const sortRdsInstances = (rdsInstance: RdsEntry, compareRdsInstance: RdsEntry) => {
  return rdsInstance.tf_label.localeCompare(compareRdsInstance.tf_label)
}

export const sortComponentRequestData = (dataItem: HasRepoName, compareDataItem: HasRepoName) => {
  return dataItem.attributes.github_repo.localeCompare(compareDataItem.attributes.github_repo)
}

export const sortGithubTeamsData = (dataItem: HasTeamName, compareDataItem: HasTeamName) => {
  return dataItem.attributes.team_name.localeCompare(compareDataItem.attributes.team_name)
}

export const getFormattedName = (req: Request, param: string): string => {
  const paramName = req.params[param]

  return paramName.replace(/[^-a-zA-Z0-9_.]/g, '')
}

export const getComponentName = (req: Request): string => {
  const { componentName } = req.params

  return componentName.replace(/[^-a-zA-Z0-9_.]/g, '')
}

export const getEnvironmentName = (req: Request): string => {
  const { environmentName } = req.params

  return environmentName.replace(/[^-a-z0-9_]/g, '')
}

export const getDependencyName = (req: Request): string => {
  const dependencyName = req.params.dependencyName || ''

  return dependencyName.replace(/[^-a-z0-9_]/g, '')
}

export const getDependencyType = (req: Request): string => {
  const dependencyType = req.params.dependencyType || ''

  return dependencyType.replace(/[^-a-z0-9_]/g, '')
}

export const isValidDropDown = (req: Request, paramName: string): boolean => {
  const param = req.query[paramName] as string

  return param !== undefined && /^[a-z0-9_-]+$/.test(param)
}

export const groupBy = <T>(arr: Array<T>, keyGetter: (t: T) => string): Record<string, T[]> => {
  return (arr || []).reduce(
    (acc, i) => {
      const key = keyGetter(i)
      const bucket = acc[key] || []
      bucket.push(i)
      acc[key] = bucket
      return acc
    },
    {} as Record<string, T[]>,
  )
}

export const associateBy = <T>(arr: Array<T>, keyGetter: (t: T) => string): Record<string, T> => {
  return (arr || []).reduce(
    (acc, i) => {
      const key = keyGetter(i)
      acc[key] = i
      return acc
    },
    {} as Record<string, T>,
  )
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
  return activeAgencies.join(', ')
}

export const relativeTimeFromNow = (date: Date): string => {
  return dayjs.default().to(dayjs.default(date))
}

export type DateDifference = {
  millis: number
  days: number
  hours: number
  description: string
  present: boolean
  sortValue: number
}

export const differenceInDate = (from: Date, to: Date): DateDifference => {
  if (!from || !to) {
    return {
      millis: 0,
      days: 0,
      hours: 0,
      description: 'not available',
      present: false,
      sortValue: Number.MIN_SAFE_INTEGER,
    }
  }
  const fromDayJs = dayjs.default(from)
  const toDayJs = dayjs.default(to)
  const days = fromDayJs.diff(toDayJs, 'days')

  return {
    millis: fromDayJs.valueOf() - toDayJs.valueOf(),
    days,
    hours: fromDayJs.diff(toDayJs, 'hours'),
    description: fromDayJs.valueOf() === toDayJs.valueOf() ? 'no difference' : fromDayJs.to(toDayJs, true),
    present: true,
    sortValue: days,
  }
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

export const median = (values: number[]): number => {
  if (values.length === 0) {
    return undefined
  }

  const sortedValues = [...values].sort((a, b) => a - b)

  const half = Math.floor(sortedValues.length / 2)

  return sortedValues.length % 2 ? sortedValues[half] : (sortedValues[half - 1] + sortedValues[half]) / 2
}

export const utcTimestampToUtcDate = (str: string) => (str ? formatDate(new Date(str), 'yyyy-MM-dd') : undefined)
