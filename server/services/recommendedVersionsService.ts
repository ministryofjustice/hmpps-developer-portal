import superagent from 'superagent'
import logger from '../../logger'

export type RecommendedVersions = {
  helm_dependencies: {
    generic_prometheus_alerts?: string
    generic_service?: string
  }
  gradle: {
    hmpps_gradle_spring_boot?: string
  }
  metadata: {
    source: 'single-file' | 'fallback' | 'partial' | 'none'
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

  constructor(
    private readonly repo: string = process.env.HMPPS_TEMPLATE_REPO || 'ministryofjustice/hmpps-template-kotlin',
    private readonly branch: string = process.env.HMPPS_TEMPLATE_BRANCH || 'main',
    private readonly ttlMillis: number = Number(process.env.RECOMMENDED_VERSIONS_TTL_MS) || 6 * 60 * 60 * 1000, // 6h
  ) {}

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

    // 1) Try single versions file (YAML)
    const singleFile = await this.tryFetchSingleVersionsFile()
    if (singleFile) {
      result.helm_dependencies.generic_prometheus_alerts = singleFile.helm_generic_prometheus_alerts
      result.helm_dependencies.generic_service = singleFile.helm_generic_service
      result.gradle.hmpps_gradle_spring_boot = singleFile.gradle_hmpps_gradle_spring_boot
      result.metadata.source = 'single-file'
    } else {
      // 2) Fallbacks
      const [helm, gradle] = await Promise.all([this.tryFetchHelmValuesYaml(), this.tryFetchGradleToml()])
      if (helm) {
        result.helm_dependencies.generic_prometheus_alerts = helm.generic_prometheus_alerts
        result.helm_dependencies.generic_service = helm.generic_service
      }
      if (gradle) {
        result.gradle.hmpps_gradle_spring_boot = gradle.hmpps_gradle_spring_boot
      }
      result.metadata.source = helm || gradle ? 'fallback' : 'none'
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

  private async tryFetchSingleVersionsFile(): Promise<{
    helm_generic_prometheus_alerts?: string
    helm_generic_service?: string
    gradle_hmpps_gradle_spring_boot?: string
  } | null> {
    const candidates = ['versions.yaml', 'versions.yml']

    // Fetch all candidates concurrently, then select the first usable result in order
    const attempts = await Promise.allSettled(
      candidates.map(async filename => {
        const url = this.rawUrl(filename)
        try {
          const text = await this.fetchText(url)
          if (!text) return null
          // Attempt to extract from a YAML that contains a top-level `versions` mapping
          // with nested keys, falling back to whole file if not found
          const within = this.extractYamlSection(text, 'versions') || text
          const helmGenericPrometheusAlerts = this.findYamlScalar(within, 'generic_prometheus_alerts')
          const helmGenericService = this.findYamlScalar(within, 'generic_service')
          const gradleHmppsGradleSpringBoot = this.findYamlScalar(within, 'hmpps_gradle_spring_boot')

          if (helmGenericPrometheusAlerts || helmGenericService || gradleHmppsGradleSpringBoot) {
            return {
              helm_generic_prometheus_alerts: helmGenericPrometheusAlerts,
              helm_generic_service: helmGenericService,
              gradle_hmpps_gradle_spring_boot: gradleHmppsGradleSpringBoot,
            }
          }
          return null
        } catch (e) {
          logger.warn(`[RecommendedVersions] Failed single file candidate ${filename}: ${String(e)}`)
          return null
        }
      }),
    )

    for (let i = 0; i < candidates.length; i += 1) {
      const settled = attempts[i]
      if (settled.status === 'fulfilled' && settled.value) {
        return settled.value
      }
    }
    return null
  }

  private async tryFetchHelmValuesYaml(): Promise<{
    generic_prometheus_alerts?: string
    generic_service?: string
  } | null> {
    const url = this.rawUrl('helm_deploy/values.yaml')
    try {
      const text = await this.fetchText(url)
      if (!text) return null
      const genericPrometheusAlerts = this.findYamlScalar(text, 'generic_prometheus_alerts')
      const genericService = this.findYamlScalar(text, 'generic_service')
      if (genericPrometheusAlerts || genericService)
        return { generic_prometheus_alerts: genericPrometheusAlerts, generic_service: genericService }
      return null
    } catch (e) {
      logger.warn(`[RecommendedVersions] Failed fetching helm values: ${String(e)}`)
      return null
    }
  }

  private async tryFetchGradleToml(): Promise<{ hmpps_gradle_spring_boot?: string } | null> {
    const url = this.rawUrl('gradle/libs.versions.toml')
    try {
      const text = await this.fetchText(url)
      if (!text) return null
      const value = this.findTomlVersion(text, 'hmpps_gradle_spring_boot')
      if (value) return { hmpps_gradle_spring_boot: value }
      // sometimes hyphens are used
      const alt = this.findTomlVersion(text, 'hmpps-gradle-spring-boot')
      if (alt) return { hmpps_gradle_spring_boot: alt }
      return null
    } catch (e) {
      logger.warn(`[RecommendedVersions] Failed fetching gradle toml: ${String(e)}`)
      return null
    }
  }

  private rawUrl(path: string): string {
    return `https://raw.githubusercontent.com/${this.repo}/${this.branch}/${path}`
  }

  private async fetchText(url: string): Promise<string> {
    const token = process.env.GITHUB_TOKEN
    const req = superagent.get(url).retry(2)
    if (token) req.set('Authorization', `Bearer ${token}`)
    const res = await req
    return res.text
  }

  // --- Simple parsers (YAML/TOML subset) ---

  /** Extracts the block under a top-level key (e.g., 'versions') preserving indentation */
  private extractYamlSection(text: string, topKey: string): string | null {
    const lines = text.split(/\r?\n/)
    let start = -1
    let baseIndent = 0
    for (let i = 0; i < lines.length; i += 1) {
      const re = new RegExp(`^(\\s*)${this.escapeRegex(topKey)}\\s*:\\s*$`)
      const m = lines[i].match(re)
      if (m) {
        start = i + 1
        baseIndent = m[1].length
        break
      }
    }
    if (start === -1) return null
    const buf: string[] = []
    for (let i = start; i < lines.length; i += 1) {
      const line = lines[i]
      const indent = line.match(/^(\s*)/)[1].length
      const trimmed = line.trim()
      if (trimmed === '' || trimmed.startsWith('#')) {
        buf.push(line)
      } else if (indent <= baseIndent) {
        break
      } else {
        buf.push(line)
      }
    }
    return buf.join('\n')
  }

  /**
   * Find a scalar value for a given YAML key anywhere in the text.
   * Matches patterns like: key: 1.2.3 or key: "1.2.3"
   */
  private findYamlScalar(text: string, key: string): string | undefined {
    const re = new RegExp(`(^|\\n)\\s*${this.escapeRegex(key)}\\s*:\\s*['"]?([^'"#\\s]+)`, 'm')
    const m = text.match(re)
    return m ? m[2] : undefined
  }

  /**
   * Find a version in a TOML [versions] section: key = "1.2.3"
   */
  private findTomlVersion(text: string, key: string): string | undefined {
    const section = this.extractTomlSection(text, 'versions') || text
    const re = new RegExp(`(^|\\n)\\s*${this.escapeRegex(key)}\\s*=\\s*['"]([^'"]+)['"]`, 'm')
    const m = section.match(re)
    return m ? m[2] : undefined
  }

  private extractTomlSection(text: string, section: string): string | null {
    const reStart = new RegExp(`(^|\\n)\\s*\\[${this.escapeRegex(section)}\\]\\s*(\\n|$)`, 'm')
    const m = text.match(reStart)
    if (!m) return null
    const startIdx = (m.index || 0) + m[0].length
    const rest = text.slice(startIdx)
    const endMatch = rest.match(/(^|\n)\s*\[[^\]]+\]\s*(\n|$)/m)
    const endIdx = endMatch && endMatch.index !== undefined ? endMatch.index : rest.length
    return rest.slice(0, endIdx)
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}
