import logger from '../../logger'
import config from '../config'
import ServiceCatalogueService from './serviceCatalogueService'

export type recommendedVersions = {
  helmDependencies: {
    genericPrometheusAlerts?: string
    genericService?: string
  }
  gradle: {
    hmppsGradleSpringBoot?: string
  }
  metadata: {
    source: 'strapi' | 'partial' | 'none'
    fetchedAt: string
  }
}

/**
 * Reusable service to retrieve current recommended dependency versions
 * from hmpps_template_kotlin.
 *
 * It first attempts to read a single versions file (versions.yaml / versions.yml).
 * If not present, it falls back to:
 *  - helm_deploy/values.yaml for helm dependency versions
 *  - gradle/libs.versions.toml for hmpps_gradle_spring_boot version
 *
 * Results are cached in-memory with TTL to avoid excessive network calls.
 */
export default class RecommendedVersionsService {
  private cache: { versions: recommendedVersions; expiresAt: number } | null = null

  private serviceCatalogueService: ServiceCatalogueService

  private readonly ttlMillis: number = config.recommendedVersions.ttlMs

  constructor(serviceCatalogueService: ServiceCatalogueService) {
    this.serviceCatalogueService = serviceCatalogueService
  }

  async getRecommendedVersions(): Promise<recommendedVersions> {
    const now = Date.now()
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.versions
    }

    const result: recommendedVersions = {
      helmDependencies: {},
      gradle: {},
      metadata: { source: 'none', fetchedAt: new Date(now).toISOString() },
    }

    // Only Strapi: hmpps-template-kotlin component
    const fromStrapi = await this.fetchRecommendedVersionsFromStrapi()
    logger.info(`[RecommendedVersions] Strapi result: ${JSON.stringify(fromStrapi)}`)
    if (fromStrapi) {
      result.helmDependencies.genericPrometheusAlerts = fromStrapi.helmGenericPrometheusAlerts
      result.helmDependencies.genericService = fromStrapi.helmGenericService
      result.gradle.hmppsGradleSpringBoot = fromStrapi.hmppsGradleSpringBoot
      result.metadata.source = 'strapi'
    }

    // Mark partial if any key is missing
    if (
      !result.helmDependencies.genericPrometheusAlerts ||
      !result.helmDependencies.genericService ||
      !result.gradle.hmppsGradleSpringBoot
    ) {
      result.metadata.source = result.metadata.source === 'none' ? 'none' : 'partial'
    }

    this.cache = {
      versions: result,
      expiresAt: now + this.ttlMillis,
    }

    logger.debug(
      `[RecommendedVersions] Source=${result.metadata.source}, helm(gpa=${
        result.helmDependencies.genericPrometheusAlerts || 'missing'
      }, gs=${result.helmDependencies.genericService || 'missing'}), gradle(hgsb=${
        result.gradle.hmppsGradleSpringBoot || 'missing'
      })`,
    )

    return result
  }

  private parseVersionValue(raw: unknown): string | undefined {
    if (raw === null || raw === undefined) return undefined
    if (typeof raw === 'string' || typeof raw === 'number') return String(raw)
    if (typeof raw === 'object') {
      const obj = raw as Record<string, unknown>
      return (obj.ref as string) || (obj.version as string) || undefined
    }
    return undefined
  }

  private async getComponentByAnyName(variantNames: string[]): Promise<unknown | null> {
    const [primaryVariant, ...fallbackVariants] = variantNames

    // Try primary first (single request)
    try {
      const component = await this.serviceCatalogueService.getComponent({ componentName: primaryVariant })
      logger.info(`[RecommendedVersions] Strapi component match: name=${primaryVariant}`)
      return component
    } catch (initialErr) {
      logger.warn(
        `[RecommendedVersions] Strapi lookup failed for primary name=${primaryVariant}: ${String(initialErr)}`,
      )
    }

    if (fallbackVariants.length === 0) {
      logger.warn(`[RecommendedVersions] Strapi component not found. Tried variants=${JSON.stringify(variantNames)}`)
      return null
    }

    // Parallel fallback attempts
    const variantLookupPromises = fallbackVariants.map(variantName =>
      this.serviceCatalogueService
        .getComponent({ componentName: variantName })
        .then(component => ({ variantName, component }))
        .catch(e => {
          logger.warn(`[RecommendedVersions] Strapi lookup failed for name=${variantName}: ${String(e)}`)
          throw e
        }),
    )

    try {
      const firstSuccessfulLookup = await Promise.any(variantLookupPromises)
      logger.info(`[RecommendedVersions] Strapi component match: name=${firstSuccessfulLookup.variantName}`)
      return firstSuccessfulLookup.component
    } catch (err) {
      logger.warn(`[RecommendedVersions] Strapi component not found. Tried variants=${JSON.stringify(variantNames)}`)
      return null
    }
  }

  private async fetchRecommendedVersionsFromStrapi(): Promise<{
    helmGenericPrometheusAlerts?: string
    helmGenericService?: string
    hmppsGradleSpringBoot?: string
  } | null> {
    try {
      const templateComponentName = config.recommendedVersions.componentName
      if (!templateComponentName) {
        logger.warn('[RecommendedVersions] Missing template component name in config.recommendedVersions.componentName')
        return null
      }

      const componentNameVariants = Array.from(
        new Set(
          [
            templateComponentName,
            templateComponentName.replace(/_/g, '-'),
            templateComponentName.replace(/-/g, '_'),
          ].filter(Boolean),
        ),
      )

      const component = await this.getComponentByAnyName(componentNameVariants)
      if (!component) {
        logger.warn(
          `[RecommendedVersions] Strapi component not found. Tried variants=${JSON.stringify(componentNameVariants)}`,
        )
        return null
      }

      const versions = (component as unknown as { versions?: Record<string, unknown> }).versions || {}
      const values = (component as unknown as { values?: Record<string, unknown> }).values || {}

      // Preferred keys from versions
      const helmDeps = (versions.helm_dependencies as Record<string, unknown>) || {}
      let helmGenericPrometheusAlerts = this.parseVersionValue(helmDeps?.generic_prometheus_alerts)
      let helmGenericService = this.parseVersionValue(helmDeps?.generic_service)
      // Fallback to hyphenated keys directly under helm_dependencies
      if (!helmGenericPrometheusAlerts) {
        helmGenericPrometheusAlerts = this.parseVersionValue(helmDeps['generic-prometheus-alerts'])
      }
      if (!helmGenericService) {
        helmGenericService = this.parseVersionValue(helmDeps['generic-service'])
      }
      let gradleHmppsGradleSpringBoot = this.parseVersionValue(
        (versions.gradle as Record<string, unknown>)?.hmpps_gradle_spring_boot,
      )

      // Legacy helm shape in versions
      if (!helmGenericPrometheusAlerts || !helmGenericService) {
        const helm = versions.helm as Record<string, unknown>
        const deps = (helm?.dependencies as Record<string, unknown>) || {}
        helmGenericPrometheusAlerts =
          helmGenericPrometheusAlerts || this.parseVersionValue(deps['generic-prometheus-alerts'])
        helmGenericService = helmGenericService || this.parseVersionValue(deps['generic-service'])
      }

      // Fallback to values container
      if (!helmGenericPrometheusAlerts || !helmGenericService || !gradleHmppsGradleSpringBoot) {
        const vHelmDeps = (values.helm_dependencies as Record<string, unknown>) || {}
        const vGradle = (values.gradle as Record<string, unknown>) || {}
        helmGenericPrometheusAlerts =
          helmGenericPrometheusAlerts || this.parseVersionValue(vHelmDeps.generic_prometheus_alerts)
        helmGenericService = helmGenericService || this.parseVersionValue(vHelmDeps.generic_service)
        // Fallback to hyphenated keys under values.helm_dependencies
        if (!helmGenericPrometheusAlerts) {
          helmGenericPrometheusAlerts = this.parseVersionValue(vHelmDeps['generic-prometheus-alerts'])
        }
        if (!helmGenericService) {
          helmGenericService = this.parseVersionValue(vHelmDeps['generic-service'])
        }
        gradleHmppsGradleSpringBoot =
          gradleHmppsGradleSpringBoot || this.parseVersionValue(vGradle.hmpps_gradle_spring_boot)
      }

      // Legacy helm shape in values
      if (!helmGenericPrometheusAlerts || !helmGenericService) {
        const vHelm = (values.helm as Record<string, unknown>) || {}
        const vDeps = (vHelm.dependencies as Record<string, unknown>) || {}
        helmGenericPrometheusAlerts =
          helmGenericPrometheusAlerts || this.parseVersionValue(vDeps['generic-prometheus-alerts'])
        helmGenericService = helmGenericService || this.parseVersionValue(vDeps['generic-service'])
      }

      const versionsKeys = Object.keys(versions || {})
      const valuesKeys = Object.keys(values || {})
      logger.debug(
        `[RecommendedVersions] Strapi containers: versions keys=${JSON.stringify(versionsKeys)}, values keys=${JSON.stringify(
          valuesKeys,
        )}`,
      )
      logger.info(
        `[RecommendedVersions] Strapi extracted helm(gpa=${helmGenericPrometheusAlerts || 'missing'}, gs=${
          helmGenericService || 'missing'
        }), gradle(hgsb=${gradleHmppsGradleSpringBoot || 'missing'})`,
      )

      if (helmGenericPrometheusAlerts || helmGenericService || gradleHmppsGradleSpringBoot) {
        return {
          helmGenericPrometheusAlerts,
          helmGenericService,
          hmppsGradleSpringBoot: gradleHmppsGradleSpringBoot,
        }
      }
    } catch (e) {
      logger.warn(`[RecommendedVersions] Failed fetching from Strapi: ${String(e)}`)
    }
    return null
  }
}
