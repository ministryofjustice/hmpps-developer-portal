import type { Component } from '../data/modelTypes'
import type { recommendedVersions } from './recommendedVersionsService'

export type dependencyKey = 'genericPrometheusAlerts' | 'genericService' | 'hmppsGradleSpringBoot'

export type dependencyComparisonItem = {
  componentName: string
  key: dependencyKey
  current?: string
  recommended?: string
  status: 'missing' | 'aligned' | 'needs-upgrade' | 'above-baseline' | 'needs-attention'
}

export type dependencyComparisonResult = {
  items: dependencyComparisonItem[]
  key?: string
  current?: string
  recommended?: string
  summary: {
    totalItems: number
    aligned: number
    needsUpgrade: number
    aboveBaseline: number
    missing: number
  }
  recommendedSource: recommendedVersions['metadata']['source']
}

// Convert various raw version representations to a string, if possible
const parseVersionToString = (raw: unknown): string | undefined => {
  if (raw === null || raw === undefined) return undefined
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw)
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return (obj.ref as string) || (obj.version as string) || undefined
  }
  return undefined
}

// Basic dotted numeric comparison (e.g. 1.2.3). Non-numeric parts ignored. "v" prefix ignored.
const compareDottedVersions = (leftVersion: string, rightVersion: string): number => {
  const parseVersionParts = (versionString: string): number[] =>
    versionString
      .replace(/^v/i, '')
      .split('.')
      .map(segment => {
        const matchResult = segment.match(/\d+/)
        return matchResult ? parseInt(matchResult[0], 10) : 0
      })

  const leftParts = parseVersionParts(leftVersion)
  const rightParts = parseVersionParts(rightVersion)
  const maxLength = Math.max(leftParts.length, rightParts.length)

  // const currentParts = {
  //   currentMajor: leftParts[0],
  //   currentMinor: leftParts[1],
  //   currentPatch: leftParts[2]
  // }
  //
  // const recommendedParts = {
  //   recommendedMajor: rightParts[0],
  //   recommendedMinor: rightParts[1],
  //   recommendedPatch: rightParts[2]
  // }

  // const compareVersions = (
  //   currentParts: { currentMajor: number, currentMinor: number, currentPatch: number },
  //   recommendedParts: { recommendedMajor: number, recommendedMinor: number, recommendedPatch: number }
  // ): number => {
  //   if (currentParts.currentMajor < recommendedParts.recommendedMajor) return -1
  //   if (currentParts.currentMajor > recommendedParts.recommendedMajor) return 1
  //
  //   if (currentParts.currentMinor < recommendedParts.recommendedMinor) return -1
  //   if (currentParts.currentMinor > recommendedParts.recommendedMinor) return 1
  //
  //   if (currentParts.currentPatch < recommendedParts.recommendedPatch) return -1
  //   if (currentParts.currentPatch > recommendedParts.recommendedPatch) return 1
  //
  //   return 0
  //
  // }
  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0
    const rightPart = rightParts[index] ?? 0
    if (leftPart > rightPart) return 1
    if (leftPart < rightPart) return -1
  }
  return 0
}
const classifyVersionStatus = (current?: string, recommended?: string): dependencyComparisonItem['status'] => {
  if (!current || !recommended) return 'missing'
  const versionComparison = compareDottedVersions(current, recommended)
  if (versionComparison < 0) return 'needs-upgrade'
  if (versionComparison === 0) return 'aligned'
  // const compareVersionsResult = compareVersions(currentParts, recommendedParts)
  // if (compareVersionsResult == -1) return 'needs-attention'
  return 'above-baseline'
}

// Extract current values from a component's versions structure, handling legacy shapes
const getCurrentDependencyVersionsFromComponent = (component: Component) => {
  const versions = (component.versions || {}) as Record<string, unknown>

  const helmDeps = (versions.helm_dependencies as Record<string, unknown>) || {}
  const helmLegacy = (versions.helm as Record<string, unknown>) || {}
  const helmLegacyDeps = (helmLegacy.dependencies as Record<string, unknown>) || {}
  const gradle = (versions.gradle as Record<string, unknown>) || {}

  const currentGenericPrometheusAlerts =
    parseVersionToString(helmDeps?.generic_prometheus_alerts) ||
    parseVersionToString(helmDeps?.['generic-prometheus-alerts']) ||
    parseVersionToString(helmLegacyDeps?.['generic-prometheus-alerts'])

  const currentGenericService =
    parseVersionToString(helmDeps?.generic_service) ||
    parseVersionToString(helmDeps?.['generic-service']) ||
    parseVersionToString(helmLegacyDeps?.['generic-service'])

  const currentHmppsGradleSpringBoot =
    parseVersionToString(gradle?.hmpps_gradle_spring_boot) ||
    parseVersionToString((gradle as Record<string, unknown>)?.['hmpps-gradle-spring-boot'])

  return {
    genericPrometheusAlerts: currentGenericPrometheusAlerts,
    genericService: currentGenericService,
    hmppsGradleSpringBoot: currentHmppsGradleSpringBoot,
  }
}

export const compareComponentDependencies = (
  component: Component,
  recommended: recommendedVersions,
): dependencyComparisonItem[] => {
  const currentVersions = getCurrentDependencyVersionsFromComponent(component)
  const recommendedVersionsMap = {
    genericPrometheusAlerts: recommended.helmDependencies.genericPrometheusAlerts,
    genericService: recommended.helmDependencies.genericService,
    hmppsGradleSpringBoot: recommended.gradle.hmppsGradleSpringBoot,
  }

  const comparisonItems: dependencyComparisonItem[] = []
  const addComparisonItem = (key: dependencyKey, current?: string, recommendedVal?: string) => {
    comparisonItems.push({
      componentName: component.name,
      key,
      current,
      recommended: recommendedVal,
      status: classifyVersionStatus(current, recommendedVal),
    })
  }

  addComparisonItem(
    'genericPrometheusAlerts',
    currentVersions.genericPrometheusAlerts,
    recommendedVersionsMap.genericPrometheusAlerts,
  )
  addComparisonItem('genericService', currentVersions.genericService, recommendedVersionsMap.genericService)
  addComparisonItem(
    'hmppsGradleSpringBoot',
    currentVersions.hmppsGradleSpringBoot,
    recommendedVersionsMap.hmppsGradleSpringBoot,
  )

  return comparisonItems
}

export const compareComponentsDependencies = (
  components: Component[],
  recommended: recommendedVersions,
): dependencyComparisonResult => {
  const allComparisonItems: dependencyComparisonItem[] = components.flatMap(c =>
    compareComponentDependencies(c, recommended),
  )
  const summary = allComparisonItems.reduce(
    (currentTotals, comparisonItem) => ({
      totalItems: currentTotals.totalItems + 1,
      aligned: currentTotals.aligned + (comparisonItem.status === 'aligned' ? 1 : 0),
      needsUpgrade: currentTotals.needsUpgrade + (comparisonItem.status === 'needs-upgrade' ? 1 : 0),
      aboveBaseline: currentTotals.aboveBaseline + (comparisonItem.status === 'above-baseline' ? 1 : 0),
      missing: currentTotals.missing + (comparisonItem.status === 'missing' ? 1 : 0),
    }),
    { totalItems: 0, aligned: 0, needsUpgrade: 0, aboveBaseline: 0, missing: 0 },
  )

  return {
    items: allComparisonItems,
    summary,
    recommendedSource: recommended.metadata.source,
  }
}
