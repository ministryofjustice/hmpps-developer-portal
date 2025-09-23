import logger from '../../logger'
import ServiceCatalogueService from './serviceCatalogueService'

export type RecommendedVersions = {
  helm_dependencies: {
    generic_prometheus_alerts?: string
    generic_service?: string
  }
  gradle: {
    hmpps_gradle_spring_boot?: string
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
  private static cache: { value: RecommendedVersions; expiresAt: number } | null = null

  private serviceCatalogueService?: ServiceCatalogueService

  constructor(
    private readonly ttlMillis: number = Number(process.env.RECOMMENDED_VERSIONS_TTL_MS) || 6 * 60 * 60 * 1000, // 6h
  ) {}

  setServiceCatalogueService(service: ServiceCatalogueService): void {
    this.serviceCatalogueService = service
  }

  async getRecommendedVersions(): Promise<RecommendedVersions> {
    const now = Date.now()
    if (RecommendedVersionsService.cache && RecommendedVersionsService.cache.expiresAt > now) {
      return RecommendedVersionsService.cache.value
    }

    const result: RecommendedVersions = {
      helm_dependencies: {},
      gradle: {},
      metadata: { source: 'none', fetchedAt: new Date(now).toISOString() },
    }

    // Only Strapi: hmpps-template-kotlin component
    const fromStrapi = await this.tryFetchFromStrapi()
    logger.info(`[RecommendedVersions] Strapi result: ${JSON.stringify(fromStrapi)}`)
    if (fromStrapi) {
      result.helm_dependencies.generic_prometheus_alerts = fromStrapi.helm_generic_prometheus_alerts
      result.helm_dependencies.generic_service = fromStrapi.helm_generic_service
      result.gradle.hmpps_gradle_spring_boot = fromStrapi.gradle_hmpps_gradle_spring_boot
      result.metadata.source = 'strapi'
    }

    // Mark partial if any key is missing
    if (
      !result.helm_dependencies.generic_prometheus_alerts ||
      !result.helm_dependencies.generic_service ||
      !result.gradle.hmpps_gradle_spring_boot
    ) {
      result.metadata.source = result.metadata.source === 'none' ? 'none' : 'partial'
    }

    RecommendedVersionsService.cache = {
      value: result,
      expiresAt: now + this.ttlMillis,
    }

    logger.info(
      `[RecommendedVersions] Source=${result.metadata.source}, helm(gpa=${
        result.helm_dependencies.generic_prometheus_alerts || 'missing'
      }, gs=${result.helm_dependencies.generic_service || 'missing'}), gradle(hgsb=${
        result.gradle.hmpps_gradle_spring_boot || 'missing'
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

  private async tryFetchFromStrapi(): Promise<{
    helm_generic_prometheus_alerts?: string
    helm_generic_service?: string
    gradle_hmpps_gradle_spring_boot?: string
  } | null> {
    try {
      if (!this.serviceCatalogueService) return null
      const provided = process.env.HMPPS_TEMPLATE_COMPONENT_NAME || 'hmpps-template-kotlin'
      const candidates = Array.from(new Set([provided, provided.replace(/_/g, '-'), provided.replace(/-/g, '_')]))

      const tryCandidate = async (idx: number): Promise<unknown | null> => {
        if (idx >= candidates.length) return null
        const name = candidates[idx]
        try {
          const comp = await this.serviceCatalogueService!.getComponent({ componentName: name })
          logger.info(`[RecommendedVersions] Strapi component match: name=${name}`)
          return comp
        } catch (e) {
          logger.warn(`[RecommendedVersions] Strapi lookup failed for name=${name}: ${String(e)}`)
          return tryCandidate(idx + 1)
        }
      }

      const component = await tryCandidate(0)
      if (!component) {
        logger.warn('[RecommendedVersions] Strapi component not found in candidate list')
        return null
      }

      const versions = (component as unknown as { versions?: Record<string, unknown> }).versions || {}
      const values = (component as unknown as { values?: Record<string, unknown> }).values || {}

      // Preferred keys from versions
      let helmGenericPrometheusAlerts = this.parseVersionValue(
        (versions.helm_dependencies as Record<string, unknown>)?.generic_prometheus_alerts,
      )
      let helmGenericService = this.parseVersionValue(
        (versions.helm_dependencies as Record<string, unknown>)?.generic_service,
      )
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
      logger.info(
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
          helm_generic_prometheus_alerts: helmGenericPrometheusAlerts,
          helm_generic_service: helmGenericService,
          gradle_hmpps_gradle_spring_boot: gradleHmppsGradleSpringBoot,
        }
      }
      return null
    } catch (e) {
      logger.warn(`[RecommendedVersions] Failed fetching from Strapi: ${String(e)}`)
      return null
    }
  }
}
