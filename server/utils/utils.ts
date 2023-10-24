import { type Request } from 'express'
import { BadRequest } from 'http-errors'

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

export const getTeamId = (req: Request): string => {
  const { teamId } = req.params

  if (!Number.isInteger(Number.parseInt(teamId, 10))) {
    throw new BadRequest()
  }

  return teamId
}

export const getServiceAreaId = (req: Request): string => {
  const { serviceAreaId } = req.params

  if (!Number.isInteger(Number.parseInt(serviceAreaId, 10))) {
    throw new BadRequest()
  }

  return serviceAreaId
}

export const getProductSetId = (req: Request): string => {
  const { productSetId } = req.params

  if (!Number.isInteger(Number.parseInt(productSetId, 10))) {
    throw new BadRequest()
  }

  return productSetId
}

export const getProductId = (req: Request): string => {
  const { productId } = req.params

  if (!Number.isInteger(Number.parseInt(productId, 10))) {
    throw new BadRequest()
  }

  return productId
}

export const getMonitorId = (req: Request): string => {
  const { monitorId } = req.params

  if (!Number.isInteger(Number.parseInt(monitorId, 10))) {
    return '0'
  }

  return monitorId
}

export const getMonitorType = (req: Request): string => {
  const { monitorType } = req.params

  return ['product', 'team', 'serviceArea'].includes(monitorType) ? monitorType : 'all'
}

export const getMonitorName = (req: Request): string => {
  const monitorName = req.params?.monitorName || ''

  return monitorName.replace(/[^-a-z0-9]/g, '')
}

export const formatMonitorName = (name: string): string => {
  const monitorName = name || ''

  return `${monitorName} `
    .trim()
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^-a-z0-9]/g, '')
    .replace(/-+/g, '-')
}

export const getComponentName = (req: Request): string => {
  const { componentName } = req.params

  return componentName.replace(/[^-a-zA-Z0-9_.]/g, '')
}

export const getEnvironmentName = (req: Request): string => {
  const { environmentName } = req.params

  return ['dev', 'development', 'staging', 'stage', 'preprod', 'prod', 'production', 'test'].includes(environmentName)
    ? environmentName
    : ''
}

export const getDependencyName = (req: Request): string => {
  const { dependencyName } = req.params

  return dependencyName.replace(/[^-a-z0-9_]/g, '')
}

export const getDependencyType = (req: Request): string => {
  const { dependencyType } = req.params

  return ['helm', 'circleci', 'dockerfile'].includes(dependencyType) ? dependencyType : 'helm'
}
