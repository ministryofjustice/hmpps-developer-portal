import type { Team, Product, Component } from '../data/modelTypes'
import logger from '../../logger'
import { mapToCanonicalEnv } from '../utils/utils'

export interface ChannelRecommendation {
  componentName: string
  environments: {
    dev: string
    preprod: string
    prod: string
  }
  currentChannels?: {
    dev?: string
    preprod?: string
    prod?: string
  }
}

export interface TeamChannelStructure {
  teamName: string
  teamSlug: string
  recommendations: ChannelRecommendation[]
  suggestedChannels: {
    nonProd: string
    prod: string
    prodAlt: string
  }
}

export default class MonitoringChannelService {
  /**
   * Generate monitoring channel recommendations for a team
   */
  generateChannelRecommendations(team: Team): TeamChannelStructure {
    logger.info(`Generating channel recommendations for team: ${team.name}`)

    const teamSlug = this.formatChannelName(team.name)
    const suggestedChannels = {
      nonProd: `#${teamSlug}-alerts-non-prod`,
      prod: `#${teamSlug}-alerts-prod`,
      prodAlt: `#${teamSlug}-alerts`,
    }

    const recommendations: ChannelRecommendation[] = []

    if (team.products && team.products.length > 0) {
      team.products.forEach((product: Product) => {
        if (product.components && product.components.length > 0) {
          product.components.forEach((component: Component) => {
            recommendations.push({
              componentName: component.name,
              environments: {
                dev: suggestedChannels.nonProd,
                preprod: suggestedChannels.nonProd,
                prod: suggestedChannels.prod,
              },
              currentChannels: this.extractCurrentChannels(component),
            })
          })
        }
      })
    }

    return {
      teamName: team.name,
      teamSlug: team.slug,
      recommendations,
      suggestedChannels,
    }
  }

  /**
   * Format team/component name for channel naming
   */
  private formatChannelName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and dashes
      .replace(/\s+/g, '-') // Replace spaces with single dash
      .replace(/-+/g, '-') // Replace multiple consecutive dashes with single dash
      .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
      .trim()
  }

  /**
   * Extract current alert channels from component environment data in Strapi
   */
  private extractCurrentChannels(component: Component): { dev?: string; preprod?: string; prod?: string } {
    const currentChannels: { dev?: string; preprod?: string; prod?: string } = {}

    if (!component.envs || component.envs.length === 0) {
      logger.debug(`Component ${component.name}: no environments found`)
      return currentChannels
    }

    logger.debug(
      `Component ${component.name}: processing ${component.envs.length} environments: ${component.envs.map(e => `${e.name}=${e.alerts_slack_channel || 'N/A'}`).join(', ')}`,
    )

    component.envs.forEach(env => {
      const envName = env.name || ''
      const canonicalEnv = mapToCanonicalEnv(envName)
      const channel = env.alerts_slack_channel

      logger.debug(`  Env: ${envName} → canonical: ${canonicalEnv}, channel: ${channel || 'N/A'}`)

      if (!channel) {
        return
      }

      if (canonicalEnv === 'dev' && !currentChannels.dev) {
        currentChannels.dev = channel
        return
      }

      if (
        (canonicalEnv === 'preprod' || canonicalEnv === 'stage' || canonicalEnv === 'uat' || canonicalEnv === 'test') &&
        !currentChannels.preprod
      ) {
        currentChannels.preprod = channel
        return
      }

      if (canonicalEnv === 'prod' && !currentChannels.prod) {
        currentChannels.prod = channel
      }
    })

    logger.debug(`Component ${component.name}: currentChannels = ${JSON.stringify(currentChannels)}`)
    return currentChannels
  }

  /**
   * Generate a visual tree structure for display
   */
  generateChannelTree(structure: TeamChannelStructure): string[] {
    const tree: string[] = []

    tree.push(`${structure.teamName}`)

    structure.recommendations.forEach((rec, index) => {
      const isLast = index === structure.recommendations.length - 1
      const prefix = isLast ? '└─' : '├─'

      tree.push(`${prefix} ${rec.componentName}`)

      const envPrefix = isLast ? '   ' : '│  '
      tree.push(`${envPrefix}├─ dev ────→ ${rec.environments.dev}`)
      tree.push(`${envPrefix}├─ preprod → ${rec.environments.preprod}`)
      tree.push(`${envPrefix}└─ prod ───→ ${rec.environments.prod}`)
    })

    return tree
  }
}
