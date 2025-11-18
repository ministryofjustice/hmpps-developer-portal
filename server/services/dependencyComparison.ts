import type { Component } from '../data/modelTypes'
import RecommendedVersionsService, { recommendedVersions } from './recommendedVersionsService'
import config from '../config'
import logger from '../../logger'

export type DependencyKey = 'genericPrometheusAlerts' | 'genericService' | 'hmppsGradleSpringBoot'

export type DependencyComparisonItem = {
  componentName: string
  key: DependencyKey
  current?: string
  recommended?: string
  status: 'missing' | 'aligned' | 'needs-upgrade' | 'above-baseline' | 'needs-attention'
}

export type DependencyComparisonResult = {
  items: DependencyComparisonItem[]
  key?: string
  current?: string
  recommended?: string
  summary: {
    totalItems: number
    aligned: number
    needsUpgrade: number
    aboveBaseline: number
    missing: number
    needsAttention: number
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

// Extract numeric version components as a triple [major, minor, patch].
// - Strips a leading "v"
// - Coerces each segment to its numeric part
// - Missing segments default to 0 (e.g., "1" -> [1,0,0], "1.12" -> [1,12,0])
const extractMajorMinorPatch = (versionString: string): [number, number, number] => {
  const normalizedVersion = versionString.replace(/^v/i, '')
  const versionSegments = normalizedVersion.split('.')
  const numericSegments = versionSegments.map(segment => {
    const matchResult = segment.match(/\d+/)
    return matchResult ? parseInt(matchResult[0], 10) : 0
  })
  return [numericSegments[0] ?? 0, numericSegments[1] ?? 0, numericSegments[2] ?? 0]
}

// Count how many explicit segments are present in the version string (1, 2, or 3+)
const countVersionSegments = (versionString: string): number => versionString.replace(/^v/i, '').split('.').length

// Compare two version triples [major, minor, patch].
// Returns 1 if left > right, -1 if left < right, 0 if equal.
const compareVersionTriples = (
  leftVersionTriple: [number, number, number],
  rightVersionTriple: [number, number, number],
): number => {
  if (leftVersionTriple[0] !== rightVersionTriple[0]) return leftVersionTriple[0] > rightVersionTriple[0] ? 1 : -1
  if (leftVersionTriple[1] !== rightVersionTriple[1]) return leftVersionTriple[1] > rightVersionTriple[1] ? 1 : -1
  if (leftVersionTriple[2] !== rightVersionTriple[2]) return leftVersionTriple[2] > rightVersionTriple[2] ? 1 : -1
  return 0
}
const classifyVersionStatus = (current?: string, recommended?: string): DependencyComparisonItem['status'] => {
  if (!current || !recommended) return 'missing'
  // Handle floating recommendations: "1" => any 1.x.x, "1.12" => any 1.12.x
  const recSegments = countVersionSegments(recommended.toString())
  const currentParts = extractMajorMinorPatch(current.toString())
  const recommendedParts = extractMajorMinorPatch(recommended.toString())

  // let status: dependencyComparisonItem['status']
  if (recSegments >= 3) {
    // Exact version recommendation
    const cmp = compareVersionTriples(currentParts, recommendedParts)
    if (cmp < 0) {
      return 'needs-upgrade'
    }
    if (cmp === 0) {
      return 'aligned'
    }
    return 'above-baseline'
  }

  if (recSegments === 2) {
    // Major.minor recommended: compare majors first, then minors
    const [cMaj, cMin] = [currentParts[0], currentParts[1]]
    const [rMaj, rMin] = [recommendedParts[0], recommendedParts[1]]

    if (cMaj < rMaj) {
      return 'needs-upgrade'
    }
    if (cMaj > rMaj) {
      return 'above-baseline'
    }
    if (countVersionSegments(current.toString()) === 1) {
      // Same major but current only specifies major (e.g., current=1, rec=1.4) → treat as aligned
      return 'aligned'
    }
    if ((cMin ?? 0) !== (rMin ?? 0) && (cMin ?? 0) < (rMin ?? 0)) {
      // Same major and minor mismatch → needs-attention
      return 'needs-attention'
    }
    // Same major and same minor
    return 'aligned'
  }
  // recSegments === 1: major-only recommendation
  const [cMaj] = [currentParts[0]]
  const [rMaj] = [recommendedParts[0]]
  if (cMaj < rMaj) return 'needs-upgrade'
  if (cMaj > rMaj) return 'above-baseline'
  return 'aligned'
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
): DependencyComparisonItem[] => {
  const currentVersions = getCurrentDependencyVersionsFromComponent(component)
  const recommendedVersionsMap = {
    genericPrometheusAlerts: recommended.helmDependencies.genericPrometheusAlerts,
    genericService: recommended.helmDependencies.genericService,
    hmppsGradleSpringBoot: recommended.gradle.hmppsGradleSpringBoot,
  }

  const comparisonItems: DependencyComparisonItem[] = []
  const addComparisonItem = (key: DependencyKey, current?: string, recommendedVal?: string) => {
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
): DependencyComparisonResult => {
  const allComparisonItems: DependencyComparisonItem[] = components.flatMap(c =>
    compareComponentDependencies(c, recommended),
  )
  const summary = allComparisonItems.reduce(
    (currentTotals, comparisonItem) => ({
      totalItems: currentTotals.totalItems + 1,
      aligned: currentTotals.aligned + (comparisonItem.status === 'aligned' ? 1 : 0),
      needsUpgrade: currentTotals.needsUpgrade + (comparisonItem.status === 'needs-upgrade' ? 1 : 0),
      aboveBaseline: currentTotals.aboveBaseline + (comparisonItem.status === 'above-baseline' ? 1 : 0),
      missing: currentTotals.missing + (comparisonItem.status === 'missing' ? 1 : 0),
      needsAttention: currentTotals.needsAttention + (comparisonItem.status === 'needs-attention' ? 1 : 0),
    }),
    { totalItems: 0, aligned: 0, needsUpgrade: 0, aboveBaseline: 0, missing: 0, needsAttention: 0 },
  )

  return {
    items: allComparisonItems,
    summary,
    recommendedSource: recommended.metadata.source,
  }
}
export async function getDependencyComparison(
  component: Component,
  recommendedVersionsService: RecommendedVersionsService,
  displayComponent: object,
): Promise<DependencyComparisonResult> {
  const isKotlin = (component.language || '') === 'Kotlin'
  const { kotlinOnly } = config.recommendedVersions

  // Dependency comparison for these components
  if (!kotlinOnly || isKotlin) {
    try {
      const recommended: recommendedVersions = await recommendedVersionsService.getRecommendedVersions()
      const comparison: DependencyComparisonResult = compareComponentsDependencies([component], recommended)
      const newDisplayComponent = { ...displayComponent }
      ;(newDisplayComponent as Record<string, unknown>).dependencyComparison = comparison

      const { totalItems, aligned, needsUpgrade, aboveBaseline, missing } = comparison.summary
      logger.info(
        `[DependencyComparison] component=${component.name} source=${comparison.recommendedSource} items=${totalItems} aligned=${aligned} needsUpgrade=${needsUpgrade} aboveBaseline=${aboveBaseline} missing=${missing}`,
      )
      const nonAligned = comparison.items.filter(items => items.status !== 'aligned')
      const previewCount = Math.min(10, nonAligned.length)
      if (previewCount > 0) {
        const preview = nonAligned
          .slice(0, previewCount)
          .map(
            item =>
              `${item.componentName}:${item.key} current=${item.current ?? 'missing'} → recommended=${item.recommended ?? 'missing'} [${item.status}]`,
          )
          .join('; ')
        logger.debug(
          `[DependencyComparison] component details (first ${previewCount} of ${nonAligned.length} non-aligned): ${preview}`,
        )
      }
      return comparison
    } catch (error) {
      logger.warn(`[DependencyComparison] Failed for component='${component.name}': ${String(error)}`)
      throw error
    }
  }
  return undefined
}
